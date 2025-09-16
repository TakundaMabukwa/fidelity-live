'use client';

import React, { memo, useMemo, useState, useEffect } from 'react';
import { 
  Clock, 
  Shield, 
  Hourglass, 
  Route, 
  Map,
  Wifi,
  WifiOff,
  Timer,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getVehicleRouteAssignmentForDay } from '@/lib/actions/route-assignments';
// Vehicle data interface for API data
interface VehicleData {
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

interface RealtimeVehicleCardProps {
  vehicle: VehicleData;
  onAction: (action: string, vehicleId: string) => void;
}


// Memoized component to prevent unnecessary re-renders
export const RealtimeVehicleCard = memo(function RealtimeVehicleCard({ 
  vehicle, 
  onAction 
}: RealtimeVehicleCardProps) {
  const [routeAssignment, setRouteAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if vehicle has route assignment for today
  useEffect(() => {
    const checkRouteAssignment = async () => {
      if (!vehicle.plate) return;
      
      try {
        setLoading(true);
        const result = await getVehicleRouteAssignmentForDay(vehicle.plate, 'today');
        if (result.success) {
          setRouteAssignment(result.data);
        }
      } catch (error) {
        console.error('Error checking route assignment:', error);
      } finally {
        setLoading(false);
      }
    };

    checkRouteAssignment();
  }, [vehicle.plate]);

  // Calculate values based on route assignment status
  const getDisplayValues = () => {
    if (loading) {
      return {
        totalStops: '...',
        completedStops: '...',
        speed: '...'
      };
    }

    if (!routeAssignment) {
      // No route assigned - show 0 or null values
      return {
        totalStops: 0,
        completedStops: 0,
        speed: '0 Km/h'
      };
    }

    // Route assigned - show actual values
    const customers = routeAssignment.assigned_route_customers || [];
    const totalStops = customers.length;
    const completedStops = customers.filter((c: any) => c.status === 'completed').length;
    
    return {
      totalStops,
      completedStops,
      speed: vehicle.speed ? `${vehicle.speed} Km/h` : '0 Km/h'
    };
  };

  const displayValues = getDisplayValues();
  
  // Memoize status colors to prevent recalculation
  const statusColors = useMemo(() => {
    const getStatusColor = (speed: number) => {
      if (speed > 0) {
        return 'bg-green-100 text-green-800 border-green-200';
      } else {
        return 'bg-red-100 text-red-800 border-red-200';
      }
    };

    const getSafetyStatusColor = (status: string) => {
      return status === 'motion' 
        ? 'bg-green-100 text-green-800' 
        : 'bg-red-100 text-red-800';
    };

    return {
      status: getStatusColor(vehicle.speed || 0),
      safety: getSafetyStatusColor((vehicle.speed || 0) > 0 ? 'motion' : 'stopped')
    };
  }, [vehicle.speed]);

  // Memoize progress percentage based on route assignment
  const progressPercentage = useMemo(() => {
    if (loading) return 0;
    if (!routeAssignment) return 0;
    
    const { totalStops, completedStops } = displayValues;
    if (typeof totalStops === 'number' && typeof completedStops === 'number' && totalStops > 0) {
      return (completedStops / totalStops) * 100;
    }
    return 0;
  }, [loading, routeAssignment, displayValues]);

  // Memoize connection status
  const connectionStatus = useMemo(() => {
    if (!vehicle.loctime) return { icon: WifiOff, color: 'text-gray-400', text: 'No Data' };
    
    const timeSinceUpdate = Date.now() - new Date(vehicle.loctime).getTime();
    
    if (timeSinceUpdate < 300000) { // Less than 5 minutes
      return { icon: Wifi, color: 'text-green-500', text: 'Recent' };
    } else if (timeSinceUpdate < 1800000) { // Less than 30 minutes
      return { icon: Wifi, color: 'text-yellow-500', text: 'Stale' };
    } else {
      return { icon: WifiOff, color: 'text-red-500', text: 'Old' };
    }
  }, [vehicle.loctime]);

  const ConnectionIcon = connectionStatus.icon;

  return (
    <div className="group bg-white shadow-lg hover:shadow-xl p-6 border border-gray-200 rounded-xl transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="font-bold text-gray-900 text-2xl">{vehicle.plate || `#${vehicle.id}`}</div>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionIcon className={`w-4 h-4 ${connectionStatus.color}`} />
          <div className={`text-sm ${connectionStatus.color}`}>{connectionStatus.text}</div>
        </div>
      </div>



      {/* Key Metrics Grid */}
      <div className="gap-4 grid grid-cols-2 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex justify-center items-center w-5 h-5 font-bold text-blue-500">S</div>
          <div>
            <div className="text-gray-500 text-xs">Speed</div>
            <div className="font-bold text-gray-900">{displayValues.speed}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Hourglass className="w-5 h-5 text-orange-500" />
          <div>
            <div className="text-gray-500 text-xs">Avg Wait Time</div>
            <div className="font-bold text-gray-900">N/A</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-teal-500" />
          <div>
            <div className="text-gray-500 text-xs">ETA to Client</div>
            <div className="font-bold text-gray-900">N/A</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-pink-500" />
          <div>
            <div className="text-gray-500 text-xs">Next Stop</div>
            <div className="font-bold text-gray-900">{vehicle.nextStop || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2 text-gray-600 text-sm">
          <span>{routeAssignment ? 'Route Progress' : 'Status'}</span>
          <span>
            {routeAssignment 
              ? `${displayValues.completedStops}/${displayValues.totalStops}`
              : (vehicle.speed || 0) > 0 ? 'Moving' : 'Stationary'
            }
          </span>
        </div>
        <div className="bg-gray-200 rounded-full w-full h-2">
          <div 
            className="bg-blue-500 rounded-full h-2 transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Last Update Info */}
      {vehicle.loctime && (
        <div className="mb-4 text-gray-500 text-xs text-center">
          Last updated: {new Date(vehicle.loctime).toLocaleTimeString()}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1"
          onClick={() => onAction('view-customers', vehicle.plate || vehicle.id)}
        >
          <Map className="mr-2 w-4 h-4" />
          View
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onAction('assign-route', vehicle.plate || vehicle.id)}
        >
          <Route className="mr-2 w-4 h-4" />
          Assign Route
        </Button>
      </div>
    </div>
  );
});
