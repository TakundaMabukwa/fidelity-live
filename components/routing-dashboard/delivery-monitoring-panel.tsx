'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Users, 
  Navigation,
  RefreshCw
} from 'lucide-react';
import { useDeliveryMonitoring } from '@/hooks/use-delivery-monitoring';
import { CustomerDeliveryStatus } from '@/lib/actions/delivery-monitoring';

interface DeliveryMonitoringPanelProps {
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
}

export function DeliveryMonitoringPanel({
  vehicleRegistration,
  customerCoordinates,
  currentPosition,
  date
}: DeliveryMonitoringPanelProps) {
  const {
    activeStop,
    customerStatuses,
    statistics,
    loading,
    error,
    isMoving,
    nearbyCustomers,
    stopStartTime,
    refreshData,
    endCurrentStop
  } = useDeliveryMonitoring({
    vehicleRegistration,
    customerCoordinates,
    currentPosition,
    date
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatStopDuration = (startTime: Date) => {
    const duration = (new Date().getTime() - startTime.getTime()) / (1000 * 60);
    if (duration < 60) {
      return `${Math.round(duration)} min`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = Math.round(duration % 60);
      return `${hours}h ${minutes}m`;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Delivery Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading delivery status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Delivery Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto mb-2 w-8 h-8 text-red-600" />
            <p className="mb-4 text-red-600">{error}</p>
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="mr-2 w-4 h-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Delivery Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="gap-4 grid grid-cols-2 md:grid-cols-4">
            <div className="text-center">
              <div className="font-bold text-blue-600 text-2xl">{statistics.total_customers}</div>
              <div className="text-gray-600 text-sm">Total Customers</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-green-600 text-2xl">{statistics.completed_deliveries}</div>
              <div className="text-gray-600 text-sm">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-orange-600 text-2xl">{statistics.pending_deliveries}</div>
              <div className="text-gray-600 text-sm">Pending</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600 text-2xl">{statistics.completion_rate.toFixed(1)}%</div>
              <div className="text-gray-600 text-sm">Completion Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Current Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Vehicle Movement Status */}
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                {isMoving ? (
                  <Navigation className="w-5 h-5 text-green-600" />
                ) : (
                  <MapPin className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {isMoving ? 'Vehicle Moving' : 'Vehicle Stopped'}
                </span>
              </div>
              <Badge variant={isMoving ? 'default' : 'destructive'}>
                {isMoving ? 'Moving' : 'Stopped'}
              </Badge>
            </div>

            {/* Active Stop Information */}
            {activeStop && stopStartTime && (
              <div className="bg-blue-50 p-3 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-blue-900">Active Stop</h4>
                  <Button onClick={endCurrentStop} variant="outline" size="sm">
                    End Stop
                  </Button>
                </div>
                <div className="text-blue-700 text-sm">
                  <p>Duration: {formatStopDuration(stopStartTime)}</p>
                  <p>Location: {activeStop.latitude.toFixed(6)}, {activeStop.longitude.toFixed(6)}</p>
                </div>
              </div>
            )}

            {/* Nearby Customers */}
            {nearbyCustomers.length > 0 && (
              <div className="bg-green-50 p-3 border border-green-200 rounded-lg">
                <h4 className="mb-2 font-medium text-green-900">Nearby Customers</h4>
                <div className="space-y-1">
                  {nearbyCustomers.map(customer => (
                    <div key={customer.id} className="flex justify-between items-center text-sm">
                      <span className="text-green-700">{customer.customer_name}</span>
                      <span className="text-green-600">{customer.distance.toFixed(0)}m</span>
                    </div>
                  ))}
                </div>
                {stopStartTime && (
                  <div className="mt-2 text-green-600 text-xs">
                    Stop duration: {formatStopDuration(stopStartTime)}
                    {formatStopDuration(stopStartTime) >= '10 min' && (
                      <span className="ml-2 font-medium text-green-800">
                        (Delivery will be marked complete)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Delivery Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Delivery Status
            </div>
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="mr-2 w-4 h-4" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customerStatuses.length === 0 ? (
            <div className="py-8 text-gray-500 text-center">
              No customer delivery status found for this vehicle today.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customerStatuses.map((status) => (
                <div 
                  key={status.id}
                  className={`p-3 rounded-lg border ${getStatusColor(status.status)}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status.status)}
                      <div>
                        <p className="font-medium">{status.customer_name}</p>
                        <p className="opacity-75 text-sm">{status.customer_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={getStatusColor(status.status)}>
                        {status.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {status.completed_at && (
                        <p className="opacity-75 mt-1 text-xs">
                          {new Date(status.completed_at).toLocaleTimeString()}
                        </p>
                      )}
                      {status.stop_duration_minutes && (
                        <p className="opacity-75 text-xs">
                          {status.stop_duration_minutes} min stop
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
