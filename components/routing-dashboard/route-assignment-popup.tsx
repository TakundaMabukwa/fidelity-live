'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Route, MapPin, Calendar, Users } from 'lucide-react';
import { getRoutes, getCustomersByLocationCode, assignCustomersToVehicle, Route as RouteType, CustomerDuration } from '@/lib/actions/routes';

interface RouteAssignmentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleRegistration: string;
  onAssignmentComplete: () => void;
}

export function RouteAssignmentPopup({ 
  isOpen, 
  onClose, 
  vehicleRegistration, 
  onAssignmentComplete 
}: RouteAssignmentPopupProps) {
  const [routes, setRoutes] = useState<RouteType[]>([]);
  const [groupedRoutes, setGroupedRoutes] = useState<Record<string, RouteType[]>>({});
  const [filteredGroupedRoutes, setFilteredGroupedRoutes] = useState<Record<string, RouteType[]>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);

  // Load routes when popup opens
  useEffect(() => {
    if (isOpen) {
      loadRoutes();
    }
  }, [isOpen]);

  // Filter grouped routes based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered: Record<string, RouteType[]> = {};
      
      Object.entries(groupedRoutes).forEach(([routeName, routeGroup]) => {
        // Check if any route in the group matches the search term
        const matchingRoutes = routeGroup.filter(route => 
          route.Route?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.LocationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          route.userGroup?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (matchingRoutes.length > 0) {
          filtered[routeName] = matchingRoutes;
        }
      });
      
      setFilteredGroupedRoutes(filtered);
    } else {
      setFilteredGroupedRoutes(groupedRoutes);
    }
  }, [searchTerm, groupedRoutes]);

  const loadRoutes = async () => {
    setLoading(true);
    try {
      console.log('Loading routes...');
      const routesData = await getRoutes();
      console.log('Routes loaded:', routesData);
      
      // Group routes by Route name
      const grouped = routesData.reduce((acc, route) => {
        const routeName = route.Route || 'Unnamed Route';
        if (!acc[routeName]) {
          acc[routeName] = [];
        }
        acc[routeName].push(route);
        return acc;
      }, {} as Record<string, RouteType[]>);
      
      console.log('Grouped routes:', grouped);
      
      setRoutes(routesData);
      setGroupedRoutes(grouped);
      setFilteredGroupedRoutes(grouped);
    } catch (error) {
      console.error('Error loading routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRouteSelect = (route: RouteType) => {
    setSelectedRoute(route);
  };

  const handleAssignRoute = async () => {
    if (!selectedRoute) return;
    
    setAssigning(true);
    try {
      // Fetch customers for the selected route in the background
      let routeCustomers: CustomerDuration[] = [];
      if (selectedRoute.LocationCode) {
        try {
          routeCustomers = await getCustomersByLocationCode(selectedRoute.LocationCode);
          console.log(`Found ${routeCustomers.length} customers for route ${selectedRoute.Route}`);
        } catch (error) {
          console.error('Error fetching customers for route:', error);
          // Continue with assignment even if customer fetch fails
        }
      }
      
      // Assign the route and customers to the vehicle
      await assignCustomersToVehicle(vehicleRegistration, selectedRoute, routeCustomers);
      onAssignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error assigning route:', error);
    } finally {
      setAssigning(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex flex-col w-[95vw] max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Assign Route to {vehicleRegistration} - Today's Routes
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 gap-4 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
            <Input
              placeholder="Search today's routes by name, location code, or user group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Routes List */}
          <div className="flex flex-col min-h-0">
            <h3 className="mb-3 font-semibold text-gray-900">
              Today's Available Routes
              {Object.keys(filteredGroupedRoutes).length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {Object.keys(filteredGroupedRoutes).length} route groups
                </Badge>
              )}
            </h3>
            <div className="flex-1 bg-white border rounded-lg overflow-y-auto">
              {loading ? (
                <div className="p-8 text-gray-500 text-center">
                  <div className="mx-auto mb-4 border-b-2 border-blue-600 rounded-full w-8 h-8 animate-spin"></div>
                  Loading today's routes...
                </div>
              ) : Object.keys(filteredGroupedRoutes).length === 0 ? (
                <div className="p-8 text-gray-500 text-center">
                  <Route className="mx-auto mb-4 w-12 h-12 text-gray-300" />
                  <h3 className="mb-2 font-medium text-lg">No routes found for today</h3>
                  <p>No active routes are available for today's date</p>
                </div>
              ) : (
                <div className="space-y-4 p-4">
                  {Object.entries(filteredGroupedRoutes).map(([routeName, routeGroup]) => (
                    <div key={routeName} className="bg-gray-50 p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-gray-900 text-lg">{routeName}</h4>
                        <Badge variant="secondary" className="text-sm">
                          {routeGroup.length} {routeGroup.length === 1 ? 'route' : 'routes'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        {routeGroup.map((route, index) => (
                          <div
                            key={route.id || index}
                            className={`p-3 cursor-pointer hover:bg-white transition-colors border-l-4 rounded ${
                              selectedRoute?.id === route.id 
                                ? 'bg-blue-50 border-blue-500' 
                                : 'border-transparent bg-white'
                            }`}
                            onClick={() => handleRouteSelect(route)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 text-gray-600 text-sm">
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    <span className="font-medium">Location:</span>
                                    {route.LocationCode || 'N/A'}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    <span className="font-medium">Group:</span>
                                    {route.userGroup || 'N/A'}
                                  </div>
                                </div>
                                {route.ServiceDays && (
                                  <div className="mt-2">
                                    <Badge variant="secondary" className="px-2 py-1 text-xs">
                                      {route.ServiceDays}
                                    </Badge>
                                  </div>
                                )}
                                {route.StartDate && (
                                  <div className="mt-1 text-gray-500 text-xs">
                                    <Calendar className="inline mr-1 w-3 h-3" />
                                    Start: {formatDate(route.StartDate)}
                                    {route.EndDate && ` - End: ${formatDate(route.EndDate)}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center gap-3 bg-gray-50 -mx-6 px-6 py-4 pt-4 border-t">
            <div className="text-gray-600 text-sm">
              {selectedRoute ? (
                <span>Selected: <span className="font-medium">{selectedRoute.Route}</span></span>
              ) : (
                <span>Please select a route to assign</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} size="lg">
                Cancel
              </Button>
              <Button 
                onClick={handleAssignRoute}
                disabled={!selectedRoute || assigning}
                size="lg"
                className="min-w-[200px]"
              >
                {assigning ? (
                  <>
                    <div className="mr-2 border-white border-b-2 rounded-full w-4 h-4 animate-spin"></div>
                    Assigning...
                  </>
                ) : (
                  'Assign Route'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
