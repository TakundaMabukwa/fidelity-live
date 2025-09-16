'use client';

import React from 'react';
import { useExternalVehicles } from '@/contexts/external-vehicles-context';
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

interface ContextExternalVehicleCardsProps {
  className?: string;
}

export function ContextExternalVehicleCards({ className }: ContextExternalVehicleCardsProps) {
  const { vehicles, loading, error, refreshVehicles, isLoaded, hasData, isMockData, isDatabaseData, externalError } = useExternalVehicles();

  const getStatusIcon = (vehicle: any) => {
    if (!vehicle.latitude || !vehicle.longitude) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    
    const speed = vehicle.speed || 0;
    if (speed > 0) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (vehicle: any) => {
    if (!vehicle.latitude || !vehicle.longitude) {
      return 'Offline';
    }
    
    const speed = vehicle.speed || 0;
    if (speed > 0) {
      return 'Moving';
    } else {
      return 'Stationary';
    }
  };

  const getStatusColor = (vehicle: any) => {
    if (!vehicle.latitude || !vehicle.longitude) {
      return 'destructive';
    }
    
    const speed = vehicle.speed || 0;
    if (speed > 0) {
      return 'default';
    } else {
      return 'secondary';
    }
  };

  const formatLocation = (latitude: string | null, longitude: string | null) => {
    if (!latitude || !longitude) return 'Location unavailable';
    return `${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="py-8 text-center">
          <div className="mb-4 text-red-500">
            <Car className="mx-auto w-12 h-12" />
          </div>
          <h3 className="mb-2 font-medium text-gray-900 text-lg">Error loading vehicles</h3>
          <p className="mb-4 text-gray-500">{error}</p>
          <Button onClick={refreshVehicles} variant="outline">
            <RefreshCw className="mr-2 w-4 h-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (loading && !isLoaded) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <div className="bg-gray-200 mb-2 rounded w-48 h-6 animate-pulse"></div>
            <div className="bg-gray-200 rounded w-32 h-4 animate-pulse"></div>
          </div>
          <div className="bg-gray-200 rounded w-24 h-8 animate-pulse"></div>
        </div>

        {/* Vehicle Cards Skeleton */}
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border border-gray-200">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gray-200 rounded w-20 h-8 animate-pulse"></div>
                    <div className="bg-gray-200 rounded w-16 h-5 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="bg-gray-200 rounded w-4 h-4 animate-pulse"></div>
                    <div className="bg-gray-200 rounded w-12 h-3 animate-pulse"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vehicle Details Skeleton */}
                <div>
                  <div className="bg-gray-200 mb-3 rounded w-32 h-5 animate-pulse"></div>
                  <div className="gap-3 grid grid-cols-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j}>
                        <div className="bg-gray-200 mb-1 rounded w-20 h-3 animate-pulse"></div>
                        <div className="bg-gray-200 rounded w-16 h-4 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Operational Metrics Skeleton */}
                <div>
                  <div className="bg-gray-200 mb-3 rounded w-40 h-5 animate-pulse"></div>
                  <div className="gap-3 grid grid-cols-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                      <div key={j} className="flex items-center space-x-2">
                        <div className="bg-gray-200 rounded w-4 h-4 animate-pulse"></div>
                        <div>
                          <div className="bg-gray-200 mb-1 rounded w-16 h-3 animate-pulse"></div>
                          <div className="bg-gray-200 rounded w-12 h-4 animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="py-4 text-center">
          <div className="mb-2 text-gray-400">
            <RefreshCw className="mx-auto w-6 h-6 animate-spin" />
          </div>
          <p className="text-gray-500 text-sm">Loading vehicle fleet data...</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="py-8 text-center">
          <div className="mb-4 text-gray-400">
            <Car className="mx-auto w-12 h-12" />
          </div>
          <h3 className="mb-2 font-medium text-gray-900 text-lg">No vehicles found</h3>
          <p className="text-gray-500">No external vehicles are available at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Data Source Warning */}
      {isDatabaseData && (
        <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            <div>
              <h4 className="font-medium text-blue-800">Using Database Data</h4>
              <p className="text-blue-700 text-sm">
                External tracking API is currently unavailable. Showing vehicle data from your database with simulated operational metrics.
                {externalError && (
                  <span className="block mt-1 text-xs">
                    External API Error: {externalError}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">External Vehicle Fleet</h3>
          <p className="text-gray-600 text-sm">
            {vehicles.length} vehicles from {isDatabaseData ? 'database' : 'external tracking system'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshVehicles}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Vehicle Cards Grid */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="border border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="font-bold text-gray-900 text-2xl">
                    {vehicle.plate}
                  </div>
                  <Badge variant={getStatusColor(vehicle) as any} className="text-xs">
                    {getStatusText(vehicle).toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(vehicle)}
                  <span className="text-gray-500 text-xs">Secured</span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Vehicle Details Section */}
              <div>
                <h4 className="mb-3 font-semibold text-gray-900">Vehicle Details</h4>
                <div className="gap-3 grid grid-cols-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Registration:</span>
                    <div className="text-gray-600">{vehicle.plate}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fleet No:</span>
                    <div className="text-gray-600">{vehicle.id}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Manufacturer:</span>
                    <div className="text-gray-600">{vehicle.branch || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Structure:</span>
                    <div className="text-gray-600">{vehicle.geozone || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Operational Metrics Section */}
              <div>
                <h4 className="mb-3 font-semibold text-gray-900">Operational Metrics</h4>
                <div className="gap-3 grid grid-cols-2 text-sm">
                  {/* Row 1 */}
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-gray-500 text-xs">Start Time</div>
                      <div className="font-medium">00:00</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-xs">CPK</div>
                    <div className="font-medium">R 0</div>
                  </div>

                  {/* Row 2 */}
                  <div className="flex items-center space-x-2">
                    <div className="flex justify-center items-center bg-purple-500 rounded w-4 h-4">
                      <div className="bg-white rounded-full w-2 h-2"></div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Safety Status</div>
                      <Badge variant="secondary" className="text-xs">
                        {vehicle.speed && vehicle.speed > 0 ? 'motion' : 'stopped'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex justify-center items-center bg-orange-500 rounded w-4 h-4">
                      <div className="bg-white rounded-full w-2 h-2"></div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Avg Wait Time</div>
                      <div className="font-medium">0</div>
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="flex items-center space-x-2">
                    <div className="flex justify-center items-center bg-purple-500 rounded w-4 h-4">
                      <div className="bg-white rounded-full w-2 h-2"></div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Engine</div>
                      <div className="font-medium">{vehicle.speed && vehicle.speed > 0 ? 'on' : 'off'}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-blue-500" />
                    <div>
                      <div className="text-gray-500 text-xs">Speed</div>
                      <div className="font-medium">{vehicle.speed ? `${vehicle.speed} Km/h` : '0 Km/h'}</div>
                    </div>
                  </div>

                  {/* Row 4 */}
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-pink-500" />
                    <div>
                      <div className="text-gray-500 text-xs">Distance from Client</div>
                      <div className="font-medium">0 km</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-green-500" />
                    <div>
                      <div className="text-gray-500 text-xs">ETA from Client</div>
                      <div className="font-medium">0 min</div>
                    </div>
                  </div>

                  {/* Row 5 */}
                  <div className="flex items-center space-x-2">
                    <div className="flex justify-center items-center bg-orange-500 rounded w-4 h-4">
                      <div className="bg-white rounded-full w-2 h-2"></div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Total Stops</div>
                      <div className="font-medium">{Math.floor(Math.random() * 100) + 20}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex justify-center items-center bg-green-500 rounded w-4 h-4">
                      <div className="bg-white rounded-full w-2 h-2"></div>
                    </div>
                    <div>
                      <div className="text-gray-500 text-xs">Completed</div>
                      <div className="font-medium">{Math.floor(Math.random() * 20)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Driver Information */}
              {vehicle.drivername && (
                <div className="pt-2 border-t">
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Driver: </span>
                    <span className="text-gray-600">{vehicle.drivername}</span>
                  </div>
                  {vehicle.address && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Location: </span>
                      <span className="text-gray-600">{vehicle.address}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
