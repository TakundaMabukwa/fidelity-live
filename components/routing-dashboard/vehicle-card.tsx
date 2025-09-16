'use client';

import React, { useState, useEffect } from 'react';
import { 
  Hourglass, 
  Key, 
  Gauge, 
  MapPin, 
  Timer, 
  Route, 
  CheckCircle,
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVehicleRouteAssignmentForDay } from '@/lib/actions/route-assignments';

export interface VehicleData {
  id: string;
  status: 'active' | 'stopped' | 'maintenance';
  startTime: string;
  cpk: string;
  safetyStatus: 'motion' | 'stopped';
  avgWaitTime: string;
  engineStatus: 'on' | 'off';
  speed: string;
  distanceFromClient: string;
  etaFromClient: string;
  numberOfStops: number;
  stopsCompleted: number;
  // Database fields
  registrationNo?: string | null;
  fleetNo?: string | null;
  manufacturer?: string | null;
  structureName?: string | null;
  address?: string | null;
  mileage?: number | null;
}

interface VehicleCardProps {
  vehicle: VehicleData;
  onAction: (action: string, vehicleId: string) => void;
}

interface RouteAssignment {
  assigned_route_customers: Array<{
    status: string;
    sequence_order: number;
    estimated_duration_minutes?: number;
    stop_duration_minutes?: number;
    customer_stops?: {
      customer: string;
      avg_minutes?: number;
    };
  }>;
  routes?: {
    Route: string;
  };
}

export function VehicleCard({ vehicle, onAction }: VehicleCardProps) {
  const [routeAssignment, setRouteAssignment] = useState<RouteAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if vehicle has route assignment for today
  useEffect(() => {
    const checkRouteAssignment = async () => {
      if (!vehicle.registrationNo) return;
      
      try {
        setLoading(true);
        const result = await getVehicleRouteAssignmentForDay(vehicle.registrationNo, 'today');
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
  }, [vehicle.registrationNo]);


  // Calculate values based on route assignment status
  const getDisplayValues = () => {
    if (loading) {
      return {
        numberOfStops: '...',
        stopsCompleted: '...',
        distanceFromClient: '...',
        etaFromClient: '...',
        speed: '...',
        avgWaitTime: '...',
        routeName: '...',
        nextStop: '...',
        estimatedTotalTime: '...',
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
        speed: vehicle.speed || '0 Km/h',
        avgWaitTime: '',
        routeName: '',
        nextStop: '',
        estimatedTotalTime: '',
        avgStopTime: ''
      };
    }

    // Route assigned - show actual values
    const customers = routeAssignment.assigned_route_customers || [];
    const totalStops = customers.length;
    const completedStops = customers.filter((c) => c.status === 'completed').length;
    const pendingStops = customers.filter((c) => c.status === 'pending');
    const inProgressStops = customers.filter((c) => c.status === 'in_progress');
    
    // Calculate estimated total time from customer stops
    const totalEstimatedMinutes = customers.reduce((total: number, customer) => {
      return total + (customer.estimated_duration_minutes || customer.customer_stops?.avg_minutes || 0);
    }, 0);
    
    // Calculate remaining time for pending and in-progress stops
    const remainingMinutes = customers
      .filter((c) => c.status !== 'completed')
      .reduce((total: number, customer) => {
        return total + (customer.estimated_duration_minutes || customer.customer_stops?.avg_minutes || 0);
      }, 0);
    
    // Calculate average wait time from completed stops
    const completedWithDuration = customers.filter((c) => c.status === 'completed' && c.stop_duration_minutes);
    const avgWaitTime = completedWithDuration.length > 0 
      ? Math.round(completedWithDuration.reduce((sum: number, c) => sum + (c.stop_duration_minutes || 0), 0) / completedWithDuration.length)
      : 0;
    
    // Get next stop (first pending or in-progress)
    const nextStop = [...inProgressStops, ...pendingStops]
      .sort((a, b) => a.sequence_order - b.sequence_order)[0];
    
    // Get route name
    const routeName = routeAssignment.routes?.Route || 'Unknown Route';
    
    return {
      numberOfStops: totalStops,
      stopsCompleted: completedStops,
      distanceFromClient: '0 km', // This would come from tracking data
      etaFromClient: remainingMinutes > 0 ? `${remainingMinutes} min` : '0 min',
      speed: vehicle.speed || '0 Km/h',
      avgWaitTime: avgWaitTime.toString(),
      routeName: routeName,
      nextStop: nextStop ? nextStop.customer_stops?.customer || 'Unknown' : 'N/A',
      estimatedTotalTime: `${totalEstimatedMinutes} min`,
      avgStopTime: avgWaitTime > 0 ? `${avgWaitTime} min` : '0 min'
    };
  };

  const displayValues = getDisplayValues();


  return (
    <div className="group bg-white shadow-lg hover:shadow-xl p-6 border border-gray-200 rounded-xl transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="font-bold text-gray-900 text-2xl">{vehicle.registrationNo || 'N/A'}</div>
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


      {/* Vehicle Data Grid */}
      <div className="gap-4 grid grid-cols-2 mb-6">
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
            <div className="font-medium text-gray-900">{vehicle.engineStatus}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Gauge className="w-5 h-5 text-cyan-500" />
          <div>
            <div className="text-gray-500 text-xs">Speed</div>
            <div className="font-medium text-gray-900">{displayValues.speed}</div>
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1"
          onClick={() => onAction('view-customers', vehicle.id)}
        >
          <Map className="mr-2 w-4 h-4" />
          View
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onAction('assign-route', vehicle.id)}
        >
          <Route className="mr-2 w-4 h-4" />
          Assign Route
        </Button>
      </div>
    </div>
  );
}