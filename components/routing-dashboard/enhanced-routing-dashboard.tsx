'use client';

import React, { useState, useEffect } from 'react';
import { ContextGroupedRoutes } from '@/components/routes/context-grouped-routes';
import { VehicleCard, VehicleData } from '@/components/routing-dashboard/vehicle-card';
import { RealtimeEnhancedVehicleCard } from '@/components/routing-dashboard/realtime-enhanced-vehicle-card';
import { ConnectionStatusIndicator, ConnectionStatusBadge } from '@/components/routing-dashboard/connection-status-indicator';
import { RoutesTable } from '@/components/routes/routes-table';
import { RouteAssignmentPopup } from '@/components/routing-dashboard/route-assignment-popup';
import { CustomerViewPopup } from '@/components/routing-dashboard/customer-view-popup';
import { RouteAssignmentDialog } from '@/components/routing-dashboard/route-assignment-dialog';
import { VehicleMapPopup } from '@/components/routing-dashboard/vehicle-map-popup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Route, 
  Car, 
  MapPin, 
  Users,
  Activity
} from 'lucide-react';
import { Route as RouteType, Vehicle } from '@/lib/types';
import { useVehicles } from '@/contexts/vehicles-context';
import { useGroupedRoutes } from '@/contexts/grouped-routes-context';
import { useExternalVehicles } from '@/contexts/external-vehicles-context';
import { useOptimizedRealtimeVehicles } from '@/hooks/use-optimized-realtime-vehicles';

// Helper function to convert database Vehicle to VehicleData for display
const convertVehicleToDisplayData = (vehicle: Vehicle): VehicleData => {
  const isActive = Math.random() > 0.3; // 70% chance of being active
  const status = isActive ? 'active' : 'stopped';
  const engineStatus = isActive ? 'on' : 'off';
  const safetyStatus = isActive ? 'motion' : 'stopped';
  
  return {
    id: vehicle.id.toString(),
    status: status as 'active' | 'stopped' | 'maintenance',
    startTime: '00:00',
    cpk: 'R 0',
    safetyStatus: safetyStatus as 'motion' | 'stopped',
    avgWaitTime: '0',
    engineStatus: engineStatus as 'on' | 'off',
    speed: isActive ? `${Math.floor(Math.random() * 10)} Km/h` : '0 Km/h',
    distanceFromClient: '0 km',
    etaFromClient: '0 min',
    numberOfStops: Math.floor(Math.random() * 100) + 20,
    stopsCompleted: Math.floor(Math.random() * 20),
    registrationNo: vehicle.registration_no,
    fleetNo: vehicle.fleet_no,
    manufacturer: vehicle.manufacturer,
    structureName: vehicle.structure_name,
    address: null, // Will be populated from real-time data or database
    mileage: null // Will be populated from real-time data or database
  };
};

interface EnhancedRoutingDashboardProps {
  className?: string;
}

export function EnhancedRoutingDashboard({ className }: EnhancedRoutingDashboardProps) {
  const { vehicles: dbVehicles, loading, error, loadVehicles, refreshVehicles, isLoaded } = useVehicles();
  const { groupedRoutes, loading: routesLoading, error: routesError, loadGroupedRoutes } = useGroupedRoutes();
  const { vehicles: externalVehicles, loading: externalLoading, error: externalError, loadVehicles: loadExternalVehicles } = useExternalVehicles();
  const { vehicles: realtimeVehicles } = useOptimizedRealtimeVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [showRoutesTable, setShowRoutesTable] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Popup states
  const [showRouteAssignment, setShowRouteAssignment] = useState(false);
  const [showCustomerView, setShowCustomerView] = useState(false);
  const [selectedVehicleRegistration, setSelectedVehicleRegistration] = useState('');
  const [showRouteAssignmentDialog, setShowRouteAssignmentDialog] = useState(false);
  const [showVehicleMap, setShowVehicleMap] = useState(false);
  const [selectedVehicleForMap, setSelectedVehicleForMap] = useState<any>(null);

  // Convert database vehicles to display format
  const vehicles = React.useMemo(() => {
    if (!Array.isArray(dbVehicles)) {
      console.warn('dbVehicles is not an array:', dbVehicles);
      return [];
    }
    return dbVehicles.map(convertVehicleToDisplayData);
  }, [dbVehicles]);

  // Auto-load database vehicles on component mount (only if not already loaded)
  useEffect(() => {
    if (!isLoaded && !loading) {
      loadVehicles();
    }
  }, [isLoaded, loading, loadVehicles]);
  
  // Note: Grouped routes and external vehicles are auto-loaded by their contexts
  // No need to manually trigger them here as they have their own loading logic

  const handleVehicleAction = (action: string, vehicleId: string) => {
    console.log(`Action: ${action} for vehicle: ${vehicleId}`);
    
    const vehicle = dbVehicles.find(v => v.id.toString() === vehicleId);
    const registrationNo = vehicle?.registration_no || vehicleId;
    
    switch (action) {
      case 'view':
        break;
      case 'view-customers':
        setSelectedVehicleRegistration(registrationNo);
        setShowCustomerView(true);
        break;
      case 'assign-route':
        setSelectedVehicleRegistration(registrationNo);
        setShowRouteAssignmentDialog(true);
        break;
      case 'view-map':
        // Find the real-time vehicle data for this vehicle
        const realtimeVehicle = realtimeVehicles.find(v => v.plate === registrationNo);
        if (realtimeVehicle) {
          setSelectedVehicleForMap(realtimeVehicle);
          setShowVehicleMap(true);
        }
        break;
      default:
        break;
    }
  };

  const handleRouteClick = (route: RouteType) => {
    setSelectedRoute(route);
    setShowRoutesTable(true);
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const stoppedVehicles = vehicles.filter(v => v.status === 'stopped').length;
  const totalStops = vehicles.reduce((sum, v) => sum + v.numberOfStops, 0);
  const completedStops = vehicles.reduce((sum, v) => sum + v.stopsCompleted, 0);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-gray-900 text-3xl">Routing Dashboard</h1>
          <p className="mt-1 text-gray-600">Comprehensive fleet and route management in real-time</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={refreshVehicles} disabled={loading}>
            <RefreshCw className={`mr-2 w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-4">
        <div className="bg-white shadow p-6 border rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-600 text-sm">Active Vehicles</p>
              <p className="font-bold text-green-600 text-2xl">{activeVehicles}</p>
            </div>
            <div className="flex justify-center items-center bg-green-100 rounded-full w-12 h-12">
              <div className="bg-green-500 rounded-full w-6 h-6"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow p-6 border rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-600 text-sm">Stopped Vehicles</p>
              <p className="font-bold text-red-600 text-2xl">{stoppedVehicles}</p>
            </div>
            <div className="flex justify-center items-center bg-red-100 rounded-full w-12 h-12">
              <div className="bg-red-500 rounded-full w-6 h-6"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow p-6 border rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-600 text-sm">Total Stops</p>
              <p className="font-bold text-blue-600 text-2xl">{totalStops}</p>
            </div>
            <div className="flex justify-center items-center bg-blue-100 rounded-full w-12 h-12">
              <div className="bg-blue-500 rounded-full w-6 h-6"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow p-6 border rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-600 text-sm">Completed</p>
              <p className="font-bold text-purple-600 text-2xl">{completedStops}</p>
            </div>
            <div className="flex justify-center items-center bg-purple-100 rounded-full w-12 h-12">
              <div className="bg-purple-500 rounded-full w-6 h-6"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="vehicles" className="flex items-center space-x-2">
            <Car className="w-4 h-4" />
            <span>Vehicle Fleet</span>
          </TabsTrigger>
          <TabsTrigger value="assignment" className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span>Route Assignment</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <div className="bg-white shadow p-4 border rounded-lg">
            <div className="flex sm:flex-row flex-col gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
                  <Input
                    placeholder="Search vehicles by ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="mr-2 w-4 h-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="stopped">Stopped</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Vehicle Cards Grid */}
          {error ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-red-500">
                <Search className="mx-auto w-12 h-12" />
              </div>
              <h3 className="mb-2 font-medium text-gray-900 text-lg">Error loading vehicles</h3>
              <p className="mb-4 text-gray-500">{error}</p>
              <Button onClick={refreshVehicles} variant="outline">
                <RefreshCw className="mr-2 w-4 h-4" />
                Try Again
              </Button>
            </div>
          ) : loading && !isLoaded ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-gray-400">
                <RefreshCw className="mx-auto w-12 h-12 animate-spin" />
              </div>
              <h3 className="mb-2 font-medium text-gray-900 text-lg">Loading vehicles...</h3>
              <p className="text-gray-500">Please wait while we fetch your vehicle data</p>
            </div>
          ) : (
            <>
              <div className="gap-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {filteredVehicles.map((vehicle) => {
                  // Find matching real-time vehicle data by registration number
                  const realtimeVehicle = realtimeVehicles.find(rtv => 
                    rtv.plate === vehicle.registrationNo || rtv.plate === vehicle.id
                  );
                  
                  // Use real-time vehicle card if we have real-time data, otherwise use regular card
                  if (realtimeVehicle) {
                    return (
                      <RealtimeEnhancedVehicleCard
                        key={vehicle.id}
                        vehicle={realtimeVehicle}
                        onAction={handleVehicleAction}
                      />
                    );
                  } else {
                    return (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        onAction={handleVehicleAction}
                      />
                    );
                  }
                })}
              </div>

              {filteredVehicles.length === 0 && (
                <div className="py-12 text-center">
                  <div className="mb-4 text-gray-400">
                    <Search className="mx-auto w-12 h-12" />
                  </div>
                  <h3 className="mb-2 font-medium text-gray-900 text-lg">No vehicles found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </>
          )}
        </TabsContent>


        {/* Vehicle Fleet Tab */}
        <TabsContent value="vehicles" className="space-y-6">
          <div className="bg-white p-6 border rounded-lg">
            <h2 className="mb-4 font-semibold text-xl">Real-time Vehicle Fleet</h2>
            <p className="mb-6 text-gray-600">
              Monitor your vehicle fleet in real-time. View vehicle status, location, 
              speed, and other important metrics from the Fidelity tracking system.
            </p>
            
            {/* Real-time Vehicle Cards */}
            {realtimeVehicles.length > 0 ? (
              <div className="gap-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                {realtimeVehicles.map((vehicle) => (
                  <RealtimeEnhancedVehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    onAction={handleVehicleAction}
                  />
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mb-4 text-gray-400">
                  <Car className="mx-auto w-12 h-12" />
                </div>
                <h3 className="mb-2 font-medium text-gray-900 text-lg">No Real-time Data</h3>
                <p className="text-gray-500">No vehicles with real-time tracking data available</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Route Assignment Tab */}
        <TabsContent value="assignment" className="space-y-6">
          <div className="bg-white p-6 border rounded-lg">
            <h2 className="mb-4 font-semibold text-xl">Route Assignment</h2>
            <p className="mb-6 text-gray-600">
              Assign routes to vehicles and manage route assignments. 
              View current assignments and make changes as needed.
            </p>
            
            {/* Routes Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <Route className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900 text-lg">Routing Information</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRoutesTable(!showRoutesTable)}
                >
                  {showRoutesTable ? 'Hide Routes' : 'Show Routes'}
                </Button>
              </div>
              
              {showRoutesTable && (
                <RoutesTable onRouteClick={handleRouteClick} />
              )}
            </div>

            {/* Assignment Actions */}
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
              <div className="bg-blue-50 p-4 border rounded-lg">
                <h4 className="mb-2 font-medium text-blue-900">Quick Actions</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start w-full"
                    onClick={() => setShowRouteAssignment(true)}
                  >
                    <MapPin className="mr-2 w-4 h-4" />
                    Assign New Route
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start w-full"
                    onClick={() => setShowCustomerView(true)}
                  >
                    <Users className="mr-2 w-4 h-4" />
                    View Customer Details
                  </Button>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 border rounded-lg">
                <h4 className="mb-2 font-medium text-green-900">Assignment Status</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Assigned Routes:</span>
                    <span className="font-medium">{activeVehicles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available Vehicles:</span>
                    <span className="font-medium">{stoppedVehicles}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Stops:</span>
                    <span className="font-medium">{totalStops}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Route Assignment Popup */}
      <RouteAssignmentPopup
        isOpen={showRouteAssignment}
        onClose={() => setShowRouteAssignment(false)}
        vehicleRegistration={selectedVehicleRegistration}
        onAssignmentComplete={() => {
          console.log('Route assignment completed');
          // TODO: Refresh vehicle data or update UI
        }}
      />

      {/* Customer View Popup */}
      <CustomerViewPopup
        isOpen={showCustomerView}
        onClose={() => setShowCustomerView(false)}
        vehicleRegistration={selectedVehicleRegistration}
      />

      {/* Route Assignment Dialog */}
      <RouteAssignmentDialog
        isOpen={showRouteAssignmentDialog}
        onClose={() => setShowRouteAssignmentDialog(false)}
        vehicleRegistration={selectedVehicleRegistration}
        onAssignRoute={(routeId, customers) => {
          console.log('Assigning route:', routeId, 'to vehicle:', selectedVehicleRegistration);
          console.log('Customers:', customers);
          // TODO: Implement actual route assignment logic
        }}
      />

      {/* Vehicle Map Popup */}
      {selectedVehicleForMap && (
        <VehicleMapPopup
          isOpen={showVehicleMap}
          onClose={() => {
            setShowVehicleMap(false);
            setSelectedVehicleForMap(null);
          }}
          vehicle={selectedVehicleForMap}
        />
      )}
    </div>
  );
}

