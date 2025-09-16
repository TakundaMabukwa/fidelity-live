'use client';

import React, { useState, useEffect } from 'react';
import { ExternalVehicle } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Car, 
  MapPin, 
  Gauge, 
  Clock, 
  Thermometer, 
  Navigation,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ExternalVehicleCardsProps {
  className?: string;
}

export function ExternalVehicleCards({ className }: ExternalVehicleCardsProps) {
  const [vehicles, setVehicles] = useState<ExternalVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/fidelity/vehicles');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch vehicles');
      }
      
      setVehicles(data.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  const getVehicleStatus = (vehicle: ExternalVehicle) => {
    if (!vehicle.latitude || !vehicle.longitude || vehicle.latitude === '0.000000' || vehicle.longitude === '0.000000') {
      return { status: 'offline', color: 'destructive', icon: XCircle };
    }
    
    if (vehicle.speed && vehicle.speed > 0) {
      return { status: 'moving', color: 'default', icon: CheckCircle };
    }
    
    return { status: 'stationary', color: 'secondary', icon: AlertCircle };
  };

  const formatLocationTime = (loctime: string | null) => {
    if (!loctime) return 'N/A';
    
    try {
      const date = new Date(loctime);
      return date.toLocaleString();
    } catch {
      return loctime;
    }
  };

  const formatAddress = (address: string | null) => {
    if (!address || address === '!! Address not found !!') {
      return 'Address not available';
    }
    return address;
  };

  const getSpeedColor = (speed: number | null) => {
    if (!speed) return 'text-gray-500';
    if (speed === 0) return 'text-yellow-600';
    if (speed < 30) return 'text-green-600';
    if (speed < 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-center items-center p-8">
          <div className="border-b-2 border-blue-600 rounded-full w-8 h-8 animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading vehicles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-red-600 text-center">
              <AlertCircle className="mx-auto mb-4 w-12 h-12" />
              <p className="font-medium">Error loading vehicles</p>
              <p className="mt-1 text-sm">{error}</p>
              <Button 
                onClick={fetchVehicles} 
                variant="outline" 
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-gray-600 text-center">
              <Car className="mx-auto mb-4 w-12 h-12 text-gray-400" />
              <p className="font-medium">No vehicles found</p>
              <p className="mt-1 text-sm">No vehicles are available at the moment.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-gray-900 text-2xl">Vehicle Fleet</h2>
          {lastUpdated && (
            <p className="mt-1 text-gray-600 text-sm">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <Button onClick={fetchVehicles} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => {
          const vehicleStatus = getVehicleStatus(vehicle);
          const StatusIcon = vehicleStatus.icon;
          
          return (
            <Card key={vehicle.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Car className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{vehicle.plate}</CardTitle>
                  </div>
                  <Badge variant={vehicleStatus.color as any} className="flex items-center space-x-1">
                    <StatusIcon className="w-3 h-3" />
                    <span className="capitalize">{vehicleStatus.status}</span>
                  </Badge>
                </div>
                {vehicle.branch && (
                  <p className="text-gray-600 text-sm">{vehicle.branch}</p>
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Speed and Location */}
                <div className="gap-4 grid grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500 text-xs">Speed</p>
                      <p className={`font-medium ${getSpeedColor(vehicle.speed)}`}>
                        {vehicle.speed !== null ? `${vehicle.speed} km/h` : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500 text-xs">Location</p>
                      <p className="font-medium text-sm">
                        {vehicle.latitude && vehicle.longitude && 
                         vehicle.latitude !== '0.000000' && vehicle.longitude !== '0.000000'
                          ? `${parseFloat(vehicle.latitude).toFixed(4)}, ${parseFloat(vehicle.longitude).toFixed(4)}`
                          : 'N/A'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Last Update Time */}
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500 text-xs">Last Update</p>
                    <p className="font-medium text-sm">
                      {formatLocationTime(vehicle.loctime)}
                    </p>
                  </div>
                </div>

                {/* Mileage */}
                {vehicle.mileage && (
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500 text-xs">Mileage</p>
                      <p className="font-medium text-sm">
                        {vehicle.mileage.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                )}

                {/* Temperature */}
                {vehicle.temperature && (
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-gray-500 text-xs">Temperature</p>
                      <p className="font-medium text-sm">{vehicle.temperature}</p>
                    </div>
                  </div>
                )}

                {/* Address */}
                <div className="pt-2 border-t">
                  <p className="mb-1 text-gray-500 text-xs">Address</p>
                  <p className="text-gray-700 text-sm">
                    {formatAddress(vehicle.address)}
                  </p>
                </div>

                {/* Driver Name */}
                {vehicle.drivername && (
                  <div className="pt-2 border-t">
                    <p className="mb-1 text-gray-500 text-xs">Driver</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {vehicle.drivername}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


