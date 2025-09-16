'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  startVehicleStop, 
  endVehicleStop, 
  getActiveVehicleStop,
  getCustomerDeliveryStatus,
  getDeliveryStatistics,
  CustomerDeliveryStatus,
  VehicleStop
} from '@/lib/actions/delivery-monitoring';

interface DeliveryMonitoringData {
  activeStop: VehicleStop | null;
  customerStatuses: CustomerDeliveryStatus[];
  statistics: {
    total_customers: number;
    completed_deliveries: number;
    pending_deliveries: number;
    failed_deliveries: number;
    completion_rate: number;
    average_stop_duration: number;
  };
  loading: boolean;
  error: string | null;
}

interface UseDeliveryMonitoringProps {
  vehicleRegistration: string;
  customerCoordinates: Array<{
    id: number;
    customer_code: string;
    customer_name: string;
    latitude: number;
    longitude: number;
  }>;
  currentPosition?: {
    latitude: number;
    longitude: number;
  };
  date?: string;
  stopThresholdMinutes?: number;
  radiusMeters?: number;
}

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function useDeliveryMonitoring({
  vehicleRegistration,
  customerCoordinates,
  currentPosition,
  date,
  stopThresholdMinutes = 10,
  radiusMeters = 200
}: UseDeliveryMonitoringProps) {
  const [data, setData] = useState<DeliveryMonitoringData>({
    activeStop: null,
    customerStatuses: [],
    statistics: {
      total_customers: 0,
      completed_deliveries: 0,
      pending_deliveries: 0,
      failed_deliveries: 0,
      completion_rate: 0,
      average_stop_duration: 0
    },
    loading: true,
    error: null
  });

  const [isMoving, setIsMoving] = useState(true);
  const [lastPosition, setLastPosition] = useState<{ latitude: number; longitude: number } | null>(null);
  const [stopStartTime, setStopStartTime] = useState<Date | null>(null);
  const [nearbyCustomers, setNearbyCustomers] = useState<Array<{
    id: number;
    customer_code: string;
    customer_name: string;
    distance: number;
  }>>([]);

  const positionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const stopCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      const [activeStopResult, statusResult, statsResult] = await Promise.all([
        getActiveVehicleStop(vehicleRegistration),
        getCustomerDeliveryStatus(vehicleRegistration, date),
        getDeliveryStatistics(vehicleRegistration, date)
      ]);

      if (activeStopResult.success) {
        setData(prev => ({ ...prev, activeStop: activeStopResult.data || null }));
      }

      if (statusResult.success) {
        setData(prev => ({ ...prev, customerStatuses: statusResult.data || [] }));
      }

      if (statsResult.success) {
        setData(prev => ({ ...prev, statistics: statsResult.data || prev.statistics }));
      }

      if (activeStopResult.error || statusResult.error || statsResult.error) {
        setData(prev => ({ 
          ...prev, 
          error: activeStopResult.error || statusResult.error || statsResult.error || 'Failed to load data'
        }));
      }
    } catch (error) {
      console.error('Error loading delivery monitoring data:', error);
      setData(prev => ({ ...prev, error: 'Failed to load data' }));
    } finally {
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [vehicleRegistration, date]);

  // Check if vehicle is moving
  const checkVehicleMovement = useCallback(() => {
    if (!currentPosition || !lastPosition) {
      setLastPosition(currentPosition || null);
      return;
    }

    const distance = calculateDistance(
      lastPosition.latitude,
      lastPosition.longitude,
      currentPosition.latitude,
      currentPosition.longitude
    );

    // Consider vehicle moving if it has moved more than 10 meters
    const moving = distance > 10;
    setIsMoving(moving);

    if (moving) {
      // Vehicle is moving, end any active stop
      if (data.activeStop) {
        endVehicleStop(vehicleRegistration);
        setData(prev => ({ ...prev, activeStop: null }));
      }
      setStopStartTime(null);
      setNearbyCustomers([]);
    } else {
      // Vehicle is stopped
      if (!data.activeStop && !stopStartTime) {
        // Start tracking a new stop
        setStopStartTime(new Date());
        startVehicleStop({
          vehicle_registration: vehicleRegistration,
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude
        }).then(result => {
          if (result.success) {
            setData(prev => ({ ...prev, activeStop: result.data || null }));
          }
        });
      }

      // Check for nearby customers
      const nearby = customerCoordinates
        .map(customer => ({
          ...customer,
          distance: calculateDistance(
            currentPosition.latitude,
            currentPosition.longitude,
            customer.latitude,
            customer.longitude
          )
        }))
        .filter(customer => customer.distance <= radiusMeters)
        .sort((a, b) => a.distance - b.distance);

      setNearbyCustomers(nearby);
    }

    setLastPosition(currentPosition);
  }, [currentPosition, lastPosition, data.activeStop, vehicleRegistration, customerCoordinates, radiusMeters, stopStartTime]);

  // Check if stop duration exceeds threshold
  const checkStopDuration = useCallback(() => {
    if (!stopStartTime || !nearbyCustomers.length) return;

    const stopDuration = (new Date().getTime() - stopStartTime.getTime()) / (1000 * 60); // minutes

    if (stopDuration >= stopThresholdMinutes) {
      // Stop duration exceeded threshold, mark deliveries as completed
      console.log(`Vehicle stopped for ${stopDuration.toFixed(1)} minutes near customers:`, nearbyCustomers);
      
      // The database trigger will automatically handle marking deliveries as completed
      // We just need to reload the data to reflect the changes
      loadData();
    }
  }, [stopStartTime, nearbyCustomers, stopThresholdMinutes, loadData]);

  // Start position monitoring
  useEffect(() => {
    if (!currentPosition) return;

    // Check movement every 30 seconds
    positionCheckInterval.current = setInterval(checkVehicleMovement, 30000);
    
    // Initial check
    checkVehicleMovement();

    return () => {
      if (positionCheckInterval.current) {
        clearInterval(positionCheckInterval.current);
      }
    };
  }, [currentPosition, checkVehicleMovement]);

  // Start stop duration monitoring
  useEffect(() => {
    if (!stopStartTime) return;

    // Check stop duration every minute
    stopCheckInterval.current = setInterval(checkStopDuration, 60000);
    
    // Initial check
    checkStopDuration();

    return () => {
      if (stopCheckInterval.current) {
        clearInterval(stopCheckInterval.current);
      }
    };
  }, [stopStartTime, checkStopDuration]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (positionCheckInterval.current) {
        clearInterval(positionCheckInterval.current);
      }
      if (stopCheckInterval.current) {
        clearInterval(stopCheckInterval.current);
      }
    };
  }, []);

  // Manual functions
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  const endCurrentStop = useCallback(async () => {
    if (data.activeStop) {
      const result = await endVehicleStop(vehicleRegistration);
      if (result.success) {
        setData(prev => ({ ...prev, activeStop: null }));
        setStopStartTime(null);
        setNearbyCustomers([]);
        loadData(); // Refresh data
      }
    }
  }, [data.activeStop, vehicleRegistration, loadData]);

  return {
    ...data,
    isMoving,
    nearbyCustomers,
    stopStartTime,
    refreshData,
    endCurrentStop
  };
}
