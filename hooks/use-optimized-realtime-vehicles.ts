'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { backgroundDataService } from '@/lib/services/background-data-service';
import { CONNECTION_STATUS } from '@/lib/config/realtime';

export interface RealtimeVehicleData {
  id: number;
  plate: string;
  speed: number | null;
  latitude: string | null;
  longitude: string | null;
  loctime: string;
  quality: string | null;
  mileage: number | null;
  pocsagstr: string | null;
  head: string | null;
  geozone: string | null;
  drivername: string | null;
  nameevent: string | null;
  temperature: string | null;
  address: string | null;
  branch: string | null;
  created_at: string;
}

export interface ConnectionStatus {
  status: keyof typeof CONNECTION_STATUS;
  lastUpdate: Date | null;
  error: string | null;
  reconnectAttempts: number;
}

export interface UseOptimizedRealtimeVehiclesReturn {
  vehicles: RealtimeVehicleData[];
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  refresh: () => Promise<void>;
  clearError: () => void;
  // Helper functions
  getVehicleByPlate: (plate: string) => RealtimeVehicleData | undefined;
  getVehiclesByBranch: (branch: string) => RealtimeVehicleData[];
  getActiveVehicles: () => RealtimeVehicleData[];
  getStationaryVehicles: () => RealtimeVehicleData[];
  getVehiclesWithLocation: () => RealtimeVehicleData[];
}

export function useOptimizedRealtimeVehicles(): UseOptimizedRealtimeVehiclesReturn {
  const [vehicles, setVehicles] = useState<RealtimeVehicleData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: CONNECTION_STATUS.DISCONNECTED,
    lastUpdate: null,
    error: null,
    reconnectAttempts: 0
  });

  const isInitializedRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Helper function to get vehicle by plate number
  const getVehicleByPlate = useCallback((plate: string): RealtimeVehicleData | undefined => {
    return vehicles.find(vehicle => 
      vehicle.plate?.toLowerCase() === plate.toLowerCase()
    );
  }, [vehicles]);

  // Helper function to get vehicles by branch
  const getVehiclesByBranch = useCallback((branch: string): RealtimeVehicleData[] => {
    return vehicles.filter(vehicle => 
      vehicle.branch?.toLowerCase().includes(branch.toLowerCase())
    );
  }, [vehicles]);

  // Helper function to get active/moving vehicles
  const getActiveVehicles = useCallback((): RealtimeVehicleData[] => {
    return vehicles.filter(vehicle => 
      vehicle.speed && vehicle.speed > 0
    );
  }, [vehicles]);

  // Helper function to get stationary vehicles
  const getStationaryVehicles = useCallback((): RealtimeVehicleData[] => {
    return vehicles.filter(vehicle => 
      !vehicle.speed || vehicle.speed === 0
    );
  }, [vehicles]);

  // Helper function to get vehicles with valid location data
  const getVehiclesWithLocation = useCallback((): RealtimeVehicleData[] => {
    return vehicles.filter(vehicle => 
      vehicle.latitude && vehicle.longitude &&
      vehicle.latitude !== '0' && vehicle.longitude !== '0'
    );
  }, [vehicles]);

  const clearError = useCallback(() => {
    setConnectionStatus(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  const refresh = useCallback(async () => {
    try {
      setConnectionStatus(prev => ({
        ...prev,
        status: CONNECTION_STATUS.CONNECTING
      }));

      const data = await backgroundDataService.refresh();
      
      if (data) {
        setVehicles(data);
        setConnectionStatus(prev => ({
          ...prev,
          status: CONNECTION_STATUS.CONNECTED,
          lastUpdate: new Date(),
          error: null
        }));
      } else {
        setConnectionStatus(prev => ({
          ...prev,
          status: CONNECTION_STATUS.ERROR,
          error: 'Failed to refresh data'
        }));
      }
    } catch (error) {
      setConnectionStatus(prev => ({
        ...prev,
        status: CONNECTION_STATUS.ERROR,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  // Initialize the service and subscribe to data updates
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    console.log('🚀 Initializing optimized real-time vehicles hook...');

    // Get initial data
    const initialData = backgroundDataService.getCurrentData();
    if (initialData.length > 0) {
      setVehicles(initialData);
      setConnectionStatus(prev => ({
        ...prev,
        status: CONNECTION_STATUS.CONNECTED,
        lastUpdate: new Date()
      }));
    }

    // Subscribe to data updates
    unsubscribeRef.current = backgroundDataService.subscribe((data) => {
      setVehicles(data);
      setConnectionStatus(prev => ({
        ...prev,
        status: CONNECTION_STATUS.CONNECTED,
        lastUpdate: new Date(),
        error: null
      }));
    });

    // Set initial status
    setConnectionStatus(prev => ({
      ...prev,
      status: CONNECTION_STATUS.CONNECTED
    }));

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Monitor service status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = backgroundDataService.getStatus();
      
      if (!status.isRunning) {
        setConnectionStatus(prev => ({
          ...prev,
          status: CONNECTION_STATUS.ERROR,
          error: 'Background service stopped'
        }));
      } else if (status.retryCount > 0) {
        setConnectionStatus(prev => ({
          ...prev,
          status: CONNECTION_STATUS.CONNECTING,
          reconnectAttempts: status.retryCount
        }));
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return {
    vehicles,
    connectionStatus,
    isConnected: connectionStatus.status === CONNECTION_STATUS.CONNECTED,
    refresh,
    clearError,
    getVehicleByPlate,
    getVehiclesByBranch,
    getActiveVehicles,
    getStationaryVehicles,
    getVehiclesWithLocation
  };
}
