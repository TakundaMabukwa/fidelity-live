'use client';

import React from 'react';
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
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
}

interface VehicleCardProps {
  vehicle: VehicleData;
  onAction: (action: string, vehicleId: string) => void;
}

export function VehicleCard({ vehicle, onAction }: VehicleCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'stopped':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSafetyStatusColor = (status: string) => {
    return status === 'motion' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  return (
    <div className="group bg-white shadow-lg hover:shadow-xl p-6 border border-gray-200 rounded-xl transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="font-bold text-gray-900 text-2xl">#{vehicle.id}</div>
          <Badge className={getStatusColor(vehicle.status)}>
            {vehicle.status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" />
          <div className="text-gray-500 text-sm">Secured</div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-gray-50 mb-4 p-3 rounded-lg">
        <div className="mb-2 font-medium text-gray-600 text-sm">Vehicle Details</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Registration:</span>
            <span className="font-mono">{vehicle.registrationNo || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fleet No:</span>
            <span className="font-mono">{vehicle.fleetNo || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Manufacturer:</span>
            <span>{vehicle.manufacturer || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Structure:</span>
            <span>{vehicle.structureName || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Vehicle Data Grid */}
      <div className="gap-4 grid grid-cols-2 mb-6">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-blue-500" />
          <div>
            <div className="text-gray-500 text-xs">Start Time</div>
            <div className="font-medium text-gray-900">{vehicle.startTime}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* <DollarSign className="w-5 h-5 text-green-500" /> */}
          R
          <div>
            <div className="text-gray-500 text-xs">CPK</div>
            <div className="font-medium text-gray-900">{vehicle.cpk}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-purple-500" />
          <div>
            <div className="text-gray-500 text-xs">Safety Status</div>
            <Badge className={getSafetyStatusColor(vehicle.safetyStatus)}>
              {vehicle.safetyStatus}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Hourglass className="w-5 h-5 text-orange-500" />
          <div>
            <div className="text-gray-500 text-xs">Avg Wait Time</div>
            <div className="font-medium text-gray-900">{vehicle.avgWaitTime}</div>
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
            <div className="font-medium text-gray-900">{vehicle.speed}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-pink-500" />
          <div>
            <div className="text-gray-500 text-xs">Distance from Client</div>
            <div className="font-medium text-gray-900">{vehicle.distanceFromClient}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Timer className="w-5 h-5 text-teal-500" />
          <div>
            <div className="text-gray-500 text-xs">ETA from Client</div>
            <div className="font-medium text-gray-900">{vehicle.etaFromClient}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Route className="w-5 h-5 text-amber-500" />
          <div>
            <div className="text-gray-500 text-xs">Total Stops</div>
            <div className="font-medium text-gray-900">{vehicle.numberOfStops}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <div>
            <div className="text-gray-500 text-xs">Completed</div>
            <div className="font-medium text-gray-900">{vehicle.stopsCompleted}</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2 text-gray-600 text-sm">
          <span>Route Progress</span>
          <span>{vehicle.stopsCompleted}/{vehicle.numberOfStops}</span>
        </div>
        <div className="bg-gray-200 rounded-full w-full h-2">
          <div 
            className="bg-blue-500 rounded-full h-2 transition-all duration-300"
            style={{ width: `${(vehicle.stopsCompleted / vehicle.numberOfStops) * 100}%` }}
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