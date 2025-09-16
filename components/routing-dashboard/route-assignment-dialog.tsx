'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, MapPin, Users, Clock, Route, RefreshCw, X, Building2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGroupedRoutes } from '@/contexts/grouped-routes-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assignRouteToVehicle } from '@/lib/actions/route-assignments';

interface RouteAssignmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleRegistration: string;
  onAssignRoute: (routeId: string, customers: any[]) => void;
}

export function RouteAssignmentDialog({ 
  isOpen, 
  onClose, 
  vehicleRegistration, 
  onAssignRoute 
}: RouteAssignmentDialogProps) {
  const { groupedRoutes, loading, error, refreshGroupedRoutes, isLoaded, hasData } = useGroupedRoutes();
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<any[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
  const [selectedDay, setSelectedDay] = useState<string>('');

  // Get current day of the week
  const getCurrentDay = () => {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[today.getDay()];
  };

  // Initialize with current day
  useEffect(() => {
    if (!selectedDay) {
      setSelectedDay(getCurrentDay());
    }
  }, [selectedDay]);

  // Load data when dialog opens
  useEffect(() => {
    if (isOpen && !isLoaded && !loading) {
      refreshGroupedRoutes();
    }
  }, [isOpen, isLoaded, loading, refreshGroupedRoutes]);

  const calculateAverageTime = (customers: any[]) => {
    if (!customers || customers.length === 0) return { minutes: 0, seconds: 0 };
    
    let totalSeconds = 0;
    let validCustomers = 0;
    
    customers.forEach(customer => {
      if (customer.avg_minutes !== null && customer.avg_minutes > 0) {
        totalSeconds += customer.avg_minutes * 60;
        validCustomers++;
      } else if (customer.avg_seconds !== null && customer.avg_seconds > 0) {
        totalSeconds += customer.avg_seconds;
        validCustomers++;
      }
    });
    
    if (validCustomers === 0) return { minutes: 0, seconds: 0 };
    
    const averageSeconds = Math.round(totalSeconds / validCustomers);
    const averageMinutes = Math.round(averageSeconds / 60);
    
    return { minutes: averageMinutes, seconds: averageSeconds };
  };

  const calculateTotalTime = (customers: any[]) => {
    if (!customers || customers.length === 0) return { minutes: 0, seconds: 0 };
    
    let totalSeconds = 0;
    
    customers.forEach(customer => {
      if (customer.avg_minutes !== null && customer.avg_minutes > 0) {
        totalSeconds += customer.avg_minutes * 60;
      } else if (customer.avg_seconds !== null && customer.avg_seconds > 0) {
        totalSeconds += customer.avg_seconds;
      }
    });
    
    const totalMinutes = Math.round(totalSeconds / 60);
    
    return { minutes: totalMinutes, seconds: totalSeconds };
  };

  // Check if a route has the selected day in its service days
  const hasDay = (serviceDays: string | null, targetDay: string) => {
    if (!serviceDays || !targetDay) return false;
    
    // Convert to lowercase for case-insensitive comparison
    const days = serviceDays.toLowerCase();
    const day = targetDay.toLowerCase();
    
    // Check for exact day match or common abbreviations
    const dayMappings: { [key: string]: string[] } = {
      'monday': ['mon', 'monday'],
      'tuesday': ['tue', 'tuesday'],
      'wednesday': ['wed', 'wednesday'],
      'thursday': ['thu', 'thursday'],
      'friday': ['fri', 'friday'],
      'saturday': ['sat', 'saturday'],
      'sunday': ['sun', 'sunday']
    };
    
    const possibleMatches = dayMappings[day] || [day];
    
    return possibleMatches.some(match => days.includes(match));
  };

  // Get all unique routes and group customers by matching LocationCode with Route
  const allRoutes = React.useMemo(() => {
    const routeMap = new Map();
    
    groupedRoutes.forEach(group => {
      group.routes.forEach(route => {
        // Only include routes that have the selected day in their service days
        if (!hasDay(route.ServiceDays, selectedDay)) {
          return;
        }
        
        // Use route.Route as the key to deduplicate routes with the same Route number
        const routeKey = route.Route;
        
        if (!routeMap.has(routeKey)) {
          routeMap.set(routeKey, {
            ...route,
            allCustomers: [],
            customerGroups: new Map(), // Group customers by location code
            allLocations: new Set() // Track all locations for this route
          });
        }
        
        const routeData = routeMap.get(routeKey);
        
        // Add this location to the set of locations for this route
        routeData.allLocations.add(group.locationCode);
        
        // Use the customers that are already matched in the grouped data
        // The API has already matched customers to routes based on LocationCode
        const matchingCustomers = group.customers;
        
        if (matchingCustomers.length > 0) {
          // Group customers by their location code
          if (!routeData.customerGroups.has(group.locationCode)) {
            routeData.customerGroups.set(group.locationCode, []);
          }
          routeData.customerGroups.get(group.locationCode).push(...matchingCustomers);
          
          // Add to all customers list
          routeData.allCustomers.push(...matchingCustomers);
        }
      });
    });
    
    // Convert Map to Array and calculate averages and totals
    return Array.from(routeMap.values()).map(route => {
      const customerGroups = Array.from(route.customerGroups.entries()).map(([locationCode, customers]) => ({
        locationCode,
        customers,
        averageTime: calculateAverageTime(customers),
        totalTime: calculateTotalTime(customers)
      }));
      
      return {
        ...route,
        customerGroups,
        totalAverageTime: calculateAverageTime(route.allCustomers),
        totalTime: calculateTotalTime(route.allCustomers),
        allLocations: Array.from(route.allLocations) // Convert Set to Array for display
      };
    });
  }, [groupedRoutes, selectedDay]);

  const formatDuration = (seconds: number | null, minutes: number | null) => {
    if (minutes !== null && minutes > 0) {
      return `${minutes} min`;
    }
    if (seconds !== null && seconds > 0) {
      return `${Math.round(seconds / 60)} min`;
    }
    return 'N/A';
  };

  const formatTotalDuration = (seconds: number | null, minutes: number | null) => {
    if (minutes !== null && minutes > 0) {
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      }
      return `${minutes} min`;
    }
    if (seconds !== null && seconds > 0) {
      const totalMinutes = Math.round(seconds / 60);
      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      }
      return `${totalMinutes} min`;
    }
    return 'N/A';
  };

  const handleRouteSelect = (route: any) => {
    setSelectedRoute(route.id); // Use route ID as the key
    setSelectedCustomers(route.allCustomers || []);
  };

  const toggleRouteExpansion = (routeKey: string) => {
    const newExpandedRoutes = new Set(expandedRoutes);
    if (newExpandedRoutes.has(routeKey)) {
      newExpandedRoutes.delete(routeKey);
    } else {
      newExpandedRoutes.add(routeKey);
    }
    setExpandedRoutes(newExpandedRoutes);
  };

  const handleAssignRoute = async () => {
    if (selectedRoute && selectedCustomers.length > 0) {
      setIsAssigning(true);
      try {
        const result = await assignRouteToVehicle({
          vehicleRegistration,
          routeId: selectedRoute,
          customers: selectedCustomers
        });

        if (result.success) {
          console.log('✅ Route assigned successfully:', result.data);
          onAssignRoute(selectedRoute, selectedCustomers);
          onClose();
        } else {
          console.error('❌ Failed to assign route:', result.error);
          // You might want to show an error message to the user
        }
      } catch (error) {
        console.error('❌ Error assigning route:', error);
      } finally {
        setIsAssigning(false);
      }
    }
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-4 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-200 rounded w-4 h-4 animate-pulse"></div>
              <div className="bg-gray-200 rounded w-32 h-6 animate-pulse"></div>
              <div className="bg-gray-200 rounded w-16 h-5 animate-pulse"></div>
            </div>
            <div className="bg-gray-200 rounded w-20 h-5 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            {[1, 2].map((j) => (
              <div key={j} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                <div className="bg-gray-200 rounded w-48 h-4 animate-pulse"></div>
                <div className="bg-gray-200 rounded w-16 h-4 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="font-semibold text-xl">
              Assign Route to {vehicleRegistration}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

         <div className="space-y-6">
           {/* Header with day selector and refresh button */}
           <div className="flex justify-between items-center">
             <div>
               <h3 className="font-semibold text-lg">Available Routes & Customers</h3>
               <p className="text-gray-600 text-sm">
                 Select a route to assign to {vehicleRegistration}
               </p>
             </div>
             <div className="flex items-center space-x-3">
               <div className="flex items-center space-x-2">
                 <span className="text-gray-600 text-sm">Day:</span>
                 <Select value={selectedDay} onValueChange={setSelectedDay}>
                   <SelectTrigger className="w-32">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Monday">Monday</SelectItem>
                     <SelectItem value="Tuesday">Tuesday</SelectItem>
                     <SelectItem value="Wednesday">Wednesday</SelectItem>
                     <SelectItem value="Thursday">Thursday</SelectItem>
                     <SelectItem value="Friday">Friday</SelectItem>
                     <SelectItem value="Saturday">Saturday</SelectItem>
                     <SelectItem value="Sunday">Sunday</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <Button
                 variant="outline"
                 size="sm"
                 onClick={refreshGroupedRoutes}
                 disabled={loading}
               >
                 <RefreshCw className={`mr-2 w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                 {loading ? 'Refreshing...' : 'Refresh'}
               </Button>
             </div>
           </div>

           {/* Day Summary */}
           {hasData && !loading && (
             <div className="bg-blue-50 p-3 border border-blue-200 rounded-lg">
               <div className="flex items-center space-x-2">
                 <Route className="w-4 h-4 text-blue-600" />
                 <span className="text-blue-800 text-sm">
                   Showing {allRoutes.length} route{allRoutes.length !== 1 ? 's' : ''} available for {selectedDay}
                 </span>
               </div>
             </div>
           )}

          {/* Error State */}
          {error && (
            <div className="py-8 text-center">
              <div className="mb-4 text-red-500">
                <Route className="mx-auto w-12 h-12" />
              </div>
              <h3 className="mb-2 font-medium text-gray-900 text-lg">Error loading routes</h3>
              <p className="mb-4 text-gray-500">{error}</p>
              <Button onClick={refreshGroupedRoutes} variant="outline">
                <RefreshCw className="mr-2 w-4 h-4" />
                Try Again
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && !isLoaded && (
            <div>
              {renderLoadingSkeleton()}
              <div className="py-4 text-center">
                <div className="mb-2 text-gray-400">
                  <RefreshCw className="mx-auto w-6 h-6 animate-spin" />
                </div>
                <p className="text-gray-500 text-sm">Loading routes and customers...</p>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!hasData && !loading && !error && (
            <div className="py-8 text-center">
              <div className="mb-4 text-gray-400">
                <Route className="mx-auto w-12 h-12" />
              </div>
              <h3 className="mb-2 font-medium text-gray-900 text-lg">No routes found</h3>
              <p className="text-gray-500">No routes are available for assignment</p>
            </div>
          )}

           {/* Routes and Customers Data */}
           {hasData && !loading && (
             <div className="space-y-3">
               {allRoutes.map((route) => (
                 <div
                   key={route.id}
                   className={`bg-white border rounded-lg transition-colors ${
                     selectedRoute === route.Route
                       ? 'border-blue-500 bg-blue-50'
                       : 'border-gray-200 hover:border-gray-300'
                   }`}
                 >
                   {/* Route Header */}
                   <div className="p-4">
                     <div className="flex justify-between items-start">
                       <div className="flex-1">
                         <div className="flex items-center space-x-3 mb-2">
                           <Building2 className="w-5 h-5 text-blue-600" />
                           <span className="font-semibold text-gray-900 text-lg">
                             Route {route.Route}
                           </span>
                           {selectedRoute === route.Route && (
                             <Badge variant="default" className="text-xs">
                               Selected
                             </Badge>
                           )}
                         </div>
                         
                         <div className="flex items-center space-x-4 mb-3 text-gray-600 text-sm">
                           <span>Service Days: {route.ServiceDays || 'Not specified'}</span>
                           <span>•</span>
                           <span>{route.allLocations?.length || 1} location{(route.allLocations?.length || 1) !== 1 ? 's' : ''}</span>
                           <span>•</span>
                           <span>{route.allCustomers?.length || 0} customers</span>
                         </div>
                       </div>
                       
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-lg">
                    {formatDuration(route.totalAverageTime?.seconds, route.totalAverageTime?.minutes)}
                  </div>
                  <div className="text-gray-600 text-sm">
                    Avg Time
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-lg">
                    {formatTotalDuration(route.totalTime?.seconds, route.totalTime?.minutes)}
                  </div>
                  <div className="text-gray-600 text-sm">
                    Total Time
                  </div>
                </div>
                         
                         <div className="flex space-x-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleRouteSelect(route)}
                             className={selectedRoute === route.id ? 'bg-blue-100 border-blue-300' : ''}
                           >
                             {selectedRoute === route.id ? 'Selected' : 'Select'}
                           </Button>
                           
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => toggleRouteExpansion(route.Route)}
                             className="p-2"
                           >
                             {expandedRoutes.has(route.Route) ? (
                               <ChevronDown className="w-4 h-4" />
                             ) : (
                               <ChevronRight className="w-4 h-4" />
                             )}
                           </Button>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Customer Details - Collapsible */}
                   {expandedRoutes.has(route.Route) && route.customerGroups && route.customerGroups.length > 0 && (
                     <div className="bg-gray-50 border-gray-200 border-t">
                       <div className="p-4">
                         <div className="flex items-center space-x-2 mb-3">
                           <Users className="w-4 h-4 text-green-600" />
                           <span className="font-medium text-gray-700">
                             Customer Stops ({route.allCustomers.length} total)
                           </span>
                         </div>
                         
                         <div className="space-y-3">
                           {route.customerGroups.map((group, groupIndex) => (
                             <div key={groupIndex} className="bg-white p-3 border rounded-lg">
                               <div className="flex justify-between items-center mb-2">
                                 <div className="flex items-center space-x-2">
                                   <MapPin className="w-4 h-4 text-blue-600" />
                                   <span className="font-medium text-gray-900">
                                     {group.locationCode}
                                   </span>
                                   <Badge variant="outline" className="text-xs">
                                     {group.customers.length} customers
                                   </Badge>
                                 </div>
                                        <div className="flex items-center space-x-4 text-gray-600">
                                          <div className="flex items-center space-x-1">
                                            <Clock className="w-3 h-3" />
                                            <span className="font-medium text-sm">
                                              Avg: {formatDuration(group.averageTime?.seconds, group.averageTime?.minutes)}
                                            </span>
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <Clock className="w-3 h-3" />
                                            <span className="font-medium text-sm">
                                              Total: {formatTotalDuration(group.totalTime?.seconds, group.totalTime?.minutes)}
                                            </span>
                                          </div>
                                        </div>
                               </div>
                               
                               <div className="space-y-2">
                                 {group.customers.map((customer, customerIndex) => (
                                   <div
                                     key={customer.id}
                                     className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm"
                                   >
                                     <div className="flex items-center space-x-2">
                                       <span className="font-medium text-gray-900">
                                         {customer.customer}
                                       </span>
                                       <Badge variant="outline" className="text-xs">
                                         {customer.code}
                                       </Badge>
                                     </div>
                                     <div className="flex items-center space-x-2 text-gray-600">
                                       <Clock className="w-3 h-3" />
                                       <span>{formatDuration(customer.avg_seconds, customer.avg_minutes)}</span>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>
                   )}
                 </div>
               ))}
             </div>
           )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
             <Button
               onClick={handleAssignRoute}
               disabled={!selectedRoute || selectedCustomers.length === 0 || isAssigning}
             >
               {isAssigning ? 'Assigning...' : `Assign Route to ${vehicleRegistration}`}
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
