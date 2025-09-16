'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Shield, 
  Hourglass, 
  Key, 
  Gauge, 
  MapPin, 
  Timer, 
  Route, 
  CheckCircle,
  Lock,
  Map,
  Navigation,
  Wifi,
  WifiOff,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getVehicleRouteAssignmentForDay } from '@/lib/actions/route-assignments';
import { useOptimizedRealtimeVehicles, RealtimeVehicleData } from '@/hooks/use-optimized-realtime-vehicles';
import { getVehicleByPlate } from '@/lib/actions/vehicles';

interface RealtimeEnhancedVehicleCardProps {
  vehicle: RealtimeVehicleData;
  onAction: (action: string, vehicleId: string) => void;
}

export function RealtimeEnhancedVehicleCard({ vehicle, onAction }: RealtimeEnhancedVehicleCardProps) {
  const [routeAssignment, setRouteAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [vehicleDetails, setVehicleDetails] = useState<any>(null);
  const [lastEvent, setLastEvent] = useState<string>('');
  const { connectionStatus } = useOptimizedRealtimeVehicles();

  // Load vehicle details and route assignment
  useEffect(() => {
    const loadVehicleData = async () => {
      if (!vehicle.plate) return;
      
      try {
        setLoading(true);
        
        // Load vehicle details from database
        const vehicleResult = await getVehicleByPlate(vehicle.plate);
        if (vehicleResult.success && vehicleResult.data) {
          setVehicleDetails(vehicleResult.data);
        }
        
        // Load route assignment for today
        const routeResult = await getVehicleRouteAssignmentForDay(vehicle.plate, 'today');
        if (routeResult.success) {
          setRouteAssignment(routeResult.data);
        } else {
          setRouteAssignment(null);
        }
      } catch (error) {
        console.error('Error loading vehicle data:', error);
        setRouteAssignment(null);
        setVehicleDetails(null);
      } finally {
        setLoading(false);
      }
    };

    loadVehicleData();
  }, [vehicle.plate]);

  // Update last event when nameevent changes
  useEffect(() => {
    if (vehicle.nameevent && vehicle.nameevent.trim() !== '') {
      setLastEvent(vehicle.nameevent);
    }
  }, [vehicle.nameevent]);

  // Calculate values based on route assignment status and real-time data
  const getDisplayValues = () => {
    if (loading) {
      return {
        numberOfStops: '...',
        stopsCompleted: '...',
        distanceFromClient: '...',
        etaFromClient: '...',
        speed: '...',
        avgWaitTime: '...',
        estimatedTotalTime: '...',
        routeName: '...',
        nextStop: '...',
        avgStopTime: '...'
      };
    }

    if (!routeAssignment) {
      // No route assigned - show empty values
      return {
        numberOfStops: 0,
        stopsCompleted: 0,
        distanceFromClient: '',
        etaFromClient: '',
        speed: vehicle.speed ? `${vehicle.speed} Km/h` : '0 Km/h',
        avgWaitTime: '',
        estimatedTotalTime: '',
        routeName: '',
        nextStop: '',
        avgStopTime: ''
      };
    }

    // Route assigned - show actual values
    const customers = routeAssignment.assigned_route_customers || [];
    const totalStops = customers.length;
    const completedStops = customers.filter((c: any) => c.status === 'completed').length;
    const pendingStops = customers.filter((c: any) => c.status === 'pending');
    const inProgressStops = customers.filter((c: any) => c.status === 'in_progress');
    
    // Calculate estimated total time from customer stops
    const totalEstimatedMinutes = customers.reduce((total: number, customer: any) => {
      return total + (customer.estimated_duration_minutes || customer.customer_stops?.avg_minutes || 0);
    }, 0);
    
    // Calculate remaining time for pending and in-progress stops
    const remainingMinutes = customers
      .filter((c: any) => c.status !== 'completed')
      .reduce((total: number, customer: any) => {
        return total + (customer.estimated_duration_minutes || customer.customer_stops?.avg_minutes || 0);
      }, 0);
    
    // Calculate average wait time from completed stops
    const completedWithDuration = customers.filter((c: any) => c.status === 'completed' && c.stop_duration_minutes);
    const avgWaitTime = completedWithDuration.length > 0 
      ? Math.round(completedWithDuration.reduce((sum: number, c: any) => sum + (c.stop_duration_minutes || 0), 0) / completedWithDuration.length)
      : 0;
    
    // Get next stop (first pending or in-progress)
    const nextStop = [...inProgressStops, ...pendingStops]
      .sort((a: any, b: any) => a.sequence_order - b.sequence_order)[0];
    
    // Get route name
    const routeName = routeAssignment.routes?.Route || 'Unknown Route';
    
    // Calculate distance to next stop if we have coordinates
    let distanceToNext = '0 km';
    if (nextStop && vehicle.latitude && vehicle.longitude && nextStop.customer_latitude && nextStop.customer_longitude) {
      const distance = calculateDistance(
        parseFloat(vehicle.latitude),
        parseFloat(vehicle.longitude),
        parseFloat(nextStop.customer_latitude),
        parseFloat(nextStop.customer_longitude)
      );
      distanceToNext = `${distance.toFixed(1)} km`;
    }
    
    return {
      numberOfStops: totalStops,
      stopsCompleted: completedStops,
      distanceFromClient: distanceToNext,
      etaFromClient: remainingMinutes > 0 ? `${remainingMinutes} min` : '0 min',
      speed: vehicle.speed ? `${vehicle.speed} Km/h` : '0 Km/h',
      avgWaitTime: avgWaitTime.toString(),
      estimatedTotalTime: `${totalEstimatedMinutes} min`,
      routeName: routeName,
      nextStop: nextStop ? nextStop.customer_stops?.customer || 'Unknown' : 'N/A',
      avgStopTime: avgWaitTime > 0 ? `${avgWaitTime} min` : '0 min'
    };
  };

  // Helper function to calculate distance between coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const displayValues = getDisplayValues();

  // Memoize status colors and indicators
  const statusInfo = useMemo(() => {
    const speed = vehicle.speed || 0;
    const hasLocation = vehicle.latitude && vehicle.longitude;
    const isRecent = vehicle.loctime && (Date.now() - new Date(vehicle.loctime).getTime()) < 300000; // 5 minutes

    // Status based on speed and location
    let status = 'offline';
    let statusColor = 'bg-gray-100 text-gray-800 border-gray-200';
    let statusIcon = WifiOff;

    if (hasLocation && isRecent) {
      if (speed > 0) {
        status = 'active';
        statusColor = 'bg-green-100 text-green-800 border-green-200';
        statusIcon = Activity;
      } else {
        status = 'stopped';
        statusColor = 'bg-yellow-100 text-yellow-800 border-yellow-200';
        statusIcon = Clock;
      }
    } else if (hasLocation && !isRecent) {
      status = 'stale';
      statusColor = 'bg-orange-100 text-orange-800 border-orange-200';
      statusIcon = AlertTriangle;
    }

    return { status, statusColor, statusIcon };
  }, [vehicle.speed, vehicle.latitude, vehicle.longitude, vehicle.loctime]);

  // Connection status indicator
  const connectionInfo = useMemo(() => {
    if (connectionStatus.status === 'connected') {
      return { icon: Wifi, color: 'text-green-500', text: 'Live' };
    } else if (connectionStatus.status === 'connecting') {
      return { icon: Wifi, color: 'text-yellow-500', text: 'Connecting' };
    } else {
      return { icon: WifiOff, color: 'text-red-500', text: 'Offline' };
    }
  }, [connectionStatus.status]);

  const ConnectionIcon = connectionInfo.icon;
  const StatusIcon = statusInfo.statusIcon;


  return (
    <div className="group bg-white shadow-lg hover:shadow-xl p-6 border border-gray-200 rounded-xl transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="font-bold text-gray-900 text-2xl">{vehicle.plate || `#${vehicle.id}`}</div>
          <Badge className={statusInfo.statusColor}>
            <StatusIcon className="mr-1 w-3 h-3" />
            {statusInfo.status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionIcon className={`w-4 h-4 ${connectionInfo.color}`} />
          <div className={`text-sm ${connectionInfo.color}`}>{connectionInfo.text}</div>
        </div>
      </div>


      {/* Route Information - Always Display */}
      <div className="bg-green-50 mb-4 p-3 border border-green-200 rounded-lg">
        <div className="mb-2 font-medium text-green-800 text-sm">Route Assignment</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-green-600">Route:</span>
            <span className="font-medium text-green-800">{displayValues.routeName || 'No Route Assigned'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Next Stop:</span>
            <span className="font-medium text-green-800">{displayValues.nextStop || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Progress:</span>
            <span className="font-medium text-green-800">{displayValues.stopsCompleted}/{displayValues.numberOfStops} stops</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Est. Total Time:</span>
            <span className="font-medium text-green-800">{displayValues.estimatedTotalTime || '0 min'}</span>
          </div>
          {displayValues.avgStopTime && displayValues.avgStopTime !== '0 min' && (
            <div className="flex justify-between">
              <span className="text-green-600">Avg Stop Time:</span>
              <span className="font-medium text-green-800">{displayValues.avgStopTime}</span>
            </div>
          )}
        </div>
      </div>


      {/* Real-time Metrics Grid */}
      <div className="gap-4 grid grid-cols-2 mb-6">
        <div className="flex items-center gap-3">
          <Gauge className="w-5 h-5 text-cyan-500" />
          <div>
            <div className="text-gray-500 text-xs">Speed</div>
            <div className="font-bold text-gray-900">{displayValues.speed}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Navigation className="w-5 h-5 text-purple-500" />
          <div>
            <div className="text-gray-500 text-xs">Heading</div>
            <div className="font-medium text-gray-900">{vehicle.head || 'N/A'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Hourglass className="w-5 h-5 text-orange-500" />
          <div>
            <div className="text-gray-500 text-xs">Avg Wait Time</div>
            <div className="font-medium text-gray-900">{displayValues.avgWaitTime || '0'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Key className="w-5 h-5 text-indigo-500" />
          <div>
            <div className="text-gray-500 text-xs">Engine</div>
            <div className="font-medium text-gray-900">{(vehicle.speed || 0) > 0 ? 'ON' : 'OFF'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-pink-500" />
          <div>
            <div className="text-gray-500 text-xs">Distance from Client</div>
            <div className="font-medium text-gray-900">{displayValues.distanceFromClient || '0 km'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-teal-500" />
          <div>
            <div className="text-gray-500 text-xs">ETA from Client</div>
            <div className="font-medium text-gray-900">{displayValues.etaFromClient || '0 min'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Route className="w-5 h-5 text-amber-500" />
          <div>
            <div className="text-gray-500 text-xs">Total Stops</div>
            <div className="font-medium text-gray-900">{displayValues.numberOfStops}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <div>
            <div className="text-gray-500 text-xs">Completed</div>
            <div className="font-medium text-gray-900">{displayValues.stopsCompleted}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-violet-500" />
          <div>
            <div className="text-gray-500 text-xs">Est. Total Time</div>
            <div className="font-medium text-gray-900">{displayValues.estimatedTotalTime}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-indigo-500" />
          <div>
            <div className="text-gray-500 text-xs">Address</div>
            <div className="max-w-32 font-medium text-gray-900 truncate">{vehicle.address || 'N/A'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Gauge className="w-5 h-5 text-emerald-500" />
          <div>
            <div className="text-gray-500 text-xs">Mileage</div>
            <div className="font-medium text-gray-900">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2 text-gray-600 text-sm">
          <span>Route Progress</span>
          <span>
            {typeof displayValues.numberOfStops === 'number' && displayValues.numberOfStops > 0 
              ? `${displayValues.stopsCompleted}/${displayValues.numberOfStops}`
              : 'No Route Assigned'
            }
          </span>
        </div>
        <div className="bg-gray-200 rounded-full w-full h-2">
          <div 
            className="bg-blue-500 rounded-full h-2 transition-all duration-300"
            style={{ 
              width: `${typeof displayValues.stopsCompleted === 'number' && typeof displayValues.numberOfStops === 'number' && displayValues.numberOfStops > 0 
                ? (displayValues.stopsCompleted / displayValues.numberOfStops) * 100 
                : 0}%` 
            }}
          />
        </div>
      </div>

      {/* Additional Info */}
      <div className="space-y-2 mb-4">
        {vehicle.temperature && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm">
              <span className="text-gray-600">Temperature:</span>
              <span className="font-medium text-gray-900">{vehicle.temperature}</span>
            </div>
          </div>
        )}
        
        {lastEvent && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full text-sm">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-blue-600">Last Event:</span>
              <span className="font-medium text-blue-900">{lastEvent}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1"
          onClick={() => onAction('view-customers', vehicle.plate || vehicle.id.toString())}
        >
          <Map className="mr-2 w-4 h-4" />
          View
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onAction('assign-route', vehicle.plate || vehicle.id.toString())}
        >
          <Route className="mr-2 w-4 h-4" />
          Assign Route
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onAction('view-map', vehicle.plate || vehicle.id.toString())}
          disabled={!vehicle.latitude || !vehicle.longitude || vehicle.latitude === '0.000000' || vehicle.longitude === '0.000000'}
        >
          <MapPin className="mr-2 w-4 h-4" />
          Map
        </Button>
      </div>
    </div>
  );
}

