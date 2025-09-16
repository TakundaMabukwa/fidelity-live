'use client';

import React from 'react';
import { useOptimizedRealtimeVehicles } from '@/hooks/use-optimized-realtime-vehicles';
import { ConnectionStatusIndicator } from './connection-status-indicator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, MapPin, Gauge, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PerformanceMonitor } from './performance-monitor';

export function RealtimeDataTest() {
  const { 
    vehicles, 
    connectionStatus, 
    isConnected, 
    getActiveVehicles, 
    getStationaryVehicles,
    getVehiclesWithLocation,
    refresh
  } = useOptimizedRealtimeVehicles();

  const activeVehicles = getActiveVehicles();
  const stationaryVehicles = getStationaryVehicles();
  const vehiclesWithLocation = getVehiclesWithLocation();

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex justify-between items-center">
        <ConnectionStatusIndicator />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refresh}
          disabled={connectionStatus.status === 'connecting'}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${connectionStatus.status === 'connecting' ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      
      {/* Stats Overview */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Vehicles</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-2xl">{vehicles.length}</div>
            <p className="text-muted-foreground text-xs">
              {isConnected ? 'Live data' : 'HTTP fallback'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Active Vehicles</CardTitle>
            <Gauge className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-green-600 text-2xl">{activeVehicles.length}</div>
            <p className="text-muted-foreground text-xs">
              Moving vehicles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Stationary</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-yellow-600 text-2xl">{stationaryVehicles.length}</div>
            <p className="text-muted-foreground text-xs">
              Stopped vehicles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">With Location</CardTitle>
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-bold text-blue-600 text-2xl">{vehiclesWithLocation.length}</div>
            <p className="text-muted-foreground text-xs">
              GPS coordinates available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Vehicle Data</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="py-8 text-muted-foreground text-center">
              No vehicle data available
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.slice(0, 10).map((vehicle) => (
                <div key={vehicle.id} className="flex justify-between items-center p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium">{vehicle.plate}</div>
                      <div className="text-muted-foreground text-sm">
                        {vehicle.branch || 'No branch'}
                      </div>
                    </div>
                    <Badge variant={vehicle.speed && vehicle.speed > 0 ? 'default' : 'secondary'}>
                      {vehicle.speed && vehicle.speed > 0 ? 'Moving' : 'Stationary'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {vehicle.speed ? `${vehicle.speed} km/h` : '0 km/h'}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {vehicle.latitude && vehicle.longitude 
                        ? `${parseFloat(vehicle.latitude).toFixed(4)}, ${parseFloat(vehicle.longitude).toFixed(4)}`
                        : 'No location'
                      }
                    </div>
                  </div>
                </div>
              ))}
              {vehicles.length > 10 && (
                <div className="text-muted-foreground text-sm text-center">
                  ... and {vehicles.length - 10} more vehicles
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Monitor */}
      <PerformanceMonitor />

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <strong>Connection Status:</strong> {connectionStatus.status}
            </div>
            <div>
              <strong>Last Update:</strong> {connectionStatus.lastUpdate?.toLocaleString() || 'Never'}
            </div>
            <div>
              <strong>Reconnect Attempts:</strong> {connectionStatus.reconnectAttempts}
            </div>
            {connectionStatus.error && (
              <div>
                <strong>Error:</strong> <span className="text-red-600">{connectionStatus.error}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
