'use client';

import React, { memo, useMemo } from 'react';
import { 
  Clock, 
  Shield, 
  Hourglass, 
  Route, 
  Map,
  Wifi,
  WifiOff,
  Timer,
  MapPin,
  Car
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RealTimeVehicleCardProps {
  vehicle: any;
  onAction: (action: string, vehicleId: string) => void;
}

// Memoized component to prevent unnecessary re-renders
export const RealTimeVehicleCard = memo(function RealTimeVehicleCard({ 
  vehicle, 
  onAction 
}: RealTimeVehicleCardProps) {
  
  // Memoize status colors to prevent recalculation
  const statusColors = useMemo(() => {
    const getStatusColor = (speed: number) => {
      if (speed > 0) {
        return 'bg-green-100 text-green-800 border-green-200';
      } else {
        return 'bg-red-100 text-red-800 border-red-200';
      }
    };

    return {
      status: getStatusColor(vehicle.speed || 0)
    };
  }, [vehicle.speed]);

  // Memoize connection status
  const connectionStatus = useMemo(() => {
    if (!vehicle.lastUpdated) return { icon: WifiOff, color: 'text-gray-400', text: 'No Data' };
    
    const timeSinceUpdate = Date.now() - new Date(vehicle.lastUpdated).getTime();
    
    if (timeSinceUpdate < 30000) { // Less than 30 seconds
      return { icon: Wifi, color: 'text-green-500', text: 'Live' };
    } else if (timeSinceUpdate < 300000) { // Less than 5 minutes
      return { icon: Wifi, color: 'text-yellow-500', text: 'Recent' };
    } else {
      return { icon: WifiOff, color: 'text-red-500', text: 'Stale' };
    }
  }, [vehicle.lastUpdated]);

  const ConnectionIcon = connectionStatus.icon;
  const status = vehicle.speed > 0 ? 'MOVING' : 'STATIONARY';

  return (
    <div className="group bg-white shadow-lg hover:shadow-xl p-6 border border-gray-200 rounded-xl transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="font-bold text-gray-900 text-2xl">{vehicle.plate}</div>
          <Badge className={statusColors.status}>
            {status}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <ConnectionIcon className={`w-4 h-4 ${connectionStatus.color}`} />
          <div className={`text-sm ${connectionStatus.color}`}>{connectionStatus.text}</div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="bg-gray-50 mb-4 p-3 rounded-lg">
        <div className="mb-2 font-medium text-gray-600 text-sm">Vehicle Details</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Plate:</span>
            <span className="font-mono">{vehicle.plate || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Branch:</span>
            <span>{vehicle.branch || 'N/A'}</span>
          </div>
          {vehicle.drivername && (
            <div className="flex justify-between">
              <span className="text-gray-500">Driver:</span>
              <span className="font-medium">{vehicle.drivername}</span>
            </div>
          )}
          {vehicle.mileage && (
            <div className="flex justify-between">
              <span className="text-gray-500">Mileage:</span>
              <span className="font-mono">{vehicle.mileage.toLocaleString()} km</span>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="gap-4 grid grid-cols-2 mb-6">
        <div className="flex items-center gap-3">
          <Car className="w-5 h-5 text-blue-500" />
          <div>
            <div className="text-gray-500 text-xs">Speed</div>
            <div className="font-bold text-gray-900">{vehicle.speed || 0} km/h</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-green-500" />
          <div>
            <div className="text-gray-500 text-xs">Location</div>
            <div className="font-bold text-gray-900 text-xs">
              {vehicle.latitude && vehicle.longitude 
                ? `${parseFloat(vehicle.latitude).toFixed(4)}, ${parseFloat(vehicle.longitude).toFixed(4)}`
                : 'N/A'
              }
            </div>
            {vehicle.address && (
              <div className="max-w-32 text-gray-500 text-xs truncate">
                {vehicle.address}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-purple-500" />
          <div>
            <div className="text-gray-500 text-xs">Status</div>
            <Badge className={vehicle.speed > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {vehicle.speed > 0 ? '🟢 Moving' : '🟡 Stationary'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-orange-500" />
          <div>
            <div className="text-gray-500 text-xs">Last Update</div>
            <div className="font-bold text-gray-900 text-xs">
              {vehicle.loctime 
                ? new Date(vehicle.loctime).toLocaleTimeString()
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      {vehicle.start_time && (
        <div className="bg-blue-50 mb-4 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-800 text-sm">Start Time:</span>
            <span className="text-blue-700 text-sm">{vehicle.start_time}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline" 
          className="flex-1"
          onClick={() => onAction('view-customers', vehicle.plate)}
        >
          <Map className="mr-2 w-4 h-4" />
          View
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => onAction('assign-route', vehicle.plate)}
        >
          <Route className="mr-2 w-4 h-4" />
          Assign Route
        </Button>
      </div>
    </div>
  );
});
