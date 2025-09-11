'use client';

import React from 'react';
import { VehicleCard, VehicleData } from '@/components/routing-dashboard/vehicle-card';
import { RoutesTable } from '@/components/routes/routes-table';
import { RouteAssignmentPopup } from '@/components/routing-dashboard/route-assignment-popup';
import { CustomerViewPopup } from '@/components/routing-dashboard/customer-view-popup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, RefreshCw, Download, Route } from 'lucide-react';
import { Route as RouteType, Vehicle } from '@/lib/types';
import { useVehicles } from '@/contexts/vehicles-context';

// Helper function to convert database Vehicle to VehicleData for display
const convertVehicleToDisplayData = (vehicle: Vehicle): VehicleData => {
  // Generate mock operational data for display purposes
  // In a real application, this would come from operational systems
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
    // Database fields
    registrationNo: vehicle.registration_no,
    fleetNo: vehicle.fleet_no,
    manufacturer: vehicle.manufacturer,
    structureName: vehicle.structure_name
  };
};

export default function RoutingDashboardPage() {
  const { vehicles: dbVehicles, loading, error, loadVehicles, refreshVehicles, isLoaded } = useVehicles();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [selectedRoute, setSelectedRoute] = React.useState<RouteType | null>(null);
  const [showRoutesTable, setShowRoutesTable] = React.useState(false);
  
  // Popup states
  const [showRouteAssignment, setShowRouteAssignment] = React.useState(false);
  const [showCustomerView, setShowCustomerView] = React.useState(false);
  const [selectedVehicleRegistration, setSelectedVehicleRegistration] = React.useState('');

  // Convert database vehicles to display format
  const vehicles = React.useMemo(() => {
    return dbVehicles.map(convertVehicleToDisplayData);
  }, [dbVehicles]);

  // Auto-load vehicles data on component mount
  React.useEffect(() => {
    if (!isLoaded && !loading) {
      loadVehicles();
    }
  }, [isLoaded, loading, loadVehicles]);

  const handleVehicleAction = (action: string, vehicleId: string) => {
    console.log(`Action: ${action} for vehicle: ${vehicleId}`);
    
    // Find the vehicle to get registration number
    const vehicle = dbVehicles.find(v => v.id.toString() === vehicleId);
    const registrationNo = vehicle?.registration_no || vehicleId;
    
    // Handle different actions
    switch (action) {
      case 'view':
        // Navigate to map view
        break;
      case 'view-customers':
        // Show customer view popup
        setSelectedVehicleRegistration(registrationNo);
        setShowCustomerView(true);
        break;
      case 'assign-route':
        // Open route assignment modal
        setSelectedVehicleRegistration(registrationNo);
        setShowRouteAssignment(true);
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-gray-900 text-3xl">Routing Dashboard</h1>
          <p className="mt-1 text-gray-600">Monitor and manage your vehicle fleet in real-time</p>
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

      {/* Routes Section */}
      <div className="bg-white shadow p-4 border rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900 text-lg">Routing Information</h2>
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
            {filteredVehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onAction={handleVehicleAction}
              />
            ))}
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
    </div>
  );
}
