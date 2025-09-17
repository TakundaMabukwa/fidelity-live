'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, MapPin, Users, Clock, Route, RefreshCw, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRoutes } from '@/contexts/routes-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useGroupedRoutes } from '@/contexts/grouped-routes-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface RoutesWithCustomersProps {
  className?: string;
}

export function RoutesWithCustomers({ className }: RoutesWithCustomersProps) {
  const { groupedRoutes, loading, error, refreshGroupedRoutes, isLoaded, hasData } = useGroupedRoutes();
  const { routes, loading: routesLoading, isLoaded: routesLoaded, loadRoutes } = useRoutes();
  const { toast } = useToast();
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());
  const [moveDialog, setMoveDialog] = useState<{ open: boolean; customerId?: number; customerName?: string; currentCode?: string }>(() => ({ open: false }));
  const [targetRouteId, setTargetRouteId] = useState<Record<number, number | null>>({});
  const [singleMoveTargetRouteId, setSingleMoveTargetRouteId] = useState<number | ''>('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [allCustomers, setAllCustomers] = useState<Array<{ id: number; customer: string; code: string | null }>>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customersPage, setCustomersPage] = useState(1);
  const [customersPageSize] = useState(50);

  // Unique list of routes by Route name (no LocationCode shown in the dropdown)
  const uniqueRoutes = React.useMemo(() => {
    const map = new Map<string, any>();
    routes.forEach(r => {
      const key = r.Route || '';
      if (!map.has(key)) map.set(key, r);
    });
    return Array.from(map.values());
  }, [routes]);

  // Map location code -> one representative Route name for display
  const codeToRouteName = React.useMemo(() => {
    const map = new Map<string, string>();
    routes.forEach(r => {
      const code = r.LocationCode as unknown as string | null;
      if (code && !map.has(code)) {
        map.set(code, r.Route || '');
      }
    });
    return map;
  }, [routes]);

  const loadAllCustomers = React.useCallback(async () => {
    try {
      setCustomersLoading(true);
      const params = new URLSearchParams();
      params.set('limit', String(customersPageSize));
      params.set('offset', String((customersPage - 1) * customersPageSize));
      if (customerSearch) params.set('q', customerSearch);
      const res = await fetch(`/api/customer-stops?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load customers');
      setAllCustomers(data.data);
    } catch (e) {
      console.error('Failed to load customers', e);
    } finally {
      setCustomersLoading(false);
    }
  }, [customersPage, customersPageSize, customerSearch]);

  useEffect(() => {
    if (addDialogOpen) {
      if (allCustomers.length === 0 && !customersLoading) {
        loadAllCustomers();
      }
      if (!routesLoaded) {
        loadRoutes();
      }
    }
  }, [addDialogOpen]);

  // Ensure routes are loaded when opening per-customer Move dialog
  useEffect(() => {
    if (moveDialog.open && !routesLoaded) {
      loadRoutes();
    }
  }, [moveDialog.open, routesLoaded, loadRoutes]);

  // Re-fetch customers when page or search changes while dialog is open
  useEffect(() => {
    if (addDialogOpen) {
      loadAllCustomers();
    }
  }, [customersPage, customerSearch, addDialogOpen, loadAllCustomers]);

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

  // Load data when component mounts
  useEffect(() => {
    if (!isLoaded && !loading) {
      refreshGroupedRoutes();
    }
  }, [isLoaded, loading, refreshGroupedRoutes]);

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

  const toggleRouteExpansion = (routeKey: string) => {
    const newExpandedRoutes = new Set(expandedRoutes);
    if (newExpandedRoutes.has(routeKey)) {
      newExpandedRoutes.delete(routeKey);
    } else {
      newExpandedRoutes.add(routeKey);
    }
    setExpandedRoutes(newExpandedRoutes);
  };

  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-200 rounded w-4 h-4 animate-pulse"></div>
                <div className="bg-gray-200 rounded w-32 h-6 animate-pulse"></div>
                <div className="bg-gray-200 rounded w-16 h-5 animate-pulse"></div>
              </div>
              <div className="bg-gray-200 rounded w-20 h-5 animate-pulse"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2].map((j) => (
                <div key={j} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <div className="bg-gray-200 rounded w-48 h-4 animate-pulse"></div>
                  <div className="bg-gray-200 rounded w-16 h-4 animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with day selector and refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">Routes with Customers</h3>
          <p className="text-gray-600 text-sm">
            View routes grouped by location code with their associated customers
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
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">Add Customer to Route</Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl w-[1000px]">
              <DialogHeader>
                <div className="flex justify-between items-center">
                  <DialogTitle>Add Customer to Route</DialogTitle>
                  <button
                    type="button"
                    className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
                    onClick={() => setAddDialogOpen(false)}
                  >
                    Close
                  </button>
                </div>
              </DialogHeader>
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <input
                    className="flex-1 border rounded px-3 py-2 text-sm"
                    placeholder="Search customers..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                  />
                  <Button variant="outline" size="sm" onClick={() => { setCustomersPage(1); loadAllCustomers(); }}>
                    {customersLoading ? 'Loading...' : 'Reload'}
                  </Button>
                  <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
                    <span>Page {customersPage}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setCustomersPage(p => Math.max(1, p - 1)); }}
                      disabled={customersPage <= 1}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-black text-white hover:bg-black/90"
                      onClick={() => { setCustomersPage(p => p + 1); }}
                    >
                      Next
                    </Button>
                  </div>
                </div>
                <div className="max-h-[500px] overflow-auto border rounded">
                  {customersLoading && (
                    <div className="divide-y">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex justify-between items-center px-3 py-2">
                          <div className="space-y-1">
                            <div className="bg-gray-200 rounded h-3 w-64 animate-pulse" />
                            <div className="bg-gray-200 rounded h-3 w-32 animate-pulse" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-gray-200 rounded h-8 w-40 animate-pulse" />
                            <div className="bg-gray-200 rounded h-8 w-16 animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!customersLoading && (allCustomers
                    .filter(c => !customerSearch || c.customer?.toLowerCase().includes(customerSearch.toLowerCase()))
                  ).map((c) => (
                    <div key={c.id} className="flex justify-between items-center px-3 py-2 border-b last:border-0 text-sm">
                      <div>
                        <span className="font-medium text-gray-900">{c.customer}</span>
                        <span className="ml-2 text-gray-500">({(c.code && codeToRouteName.get(c.code)) || 'N/A'})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={targetRouteId[c.id] ?? ''}
                          onChange={(e) => setTargetRouteId(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                        >
                          <option value="" disabled>Select route</option>
                          {uniqueRoutes.map(r => (
                            <option key={r.id} value={r.id}>{r.Route || 'Unnamed Route'}</option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            const selected = targetRouteId[c.id];
                            if (!selected) return;
                            try {
                              const res = await fetch('/api/routes/move-customer', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ customerId: c.id, targetRouteId: selected })
                              });
                              const data = await res.json();
                              if (!res.ok || !data.success) throw new Error(data.error || 'Failed to move');
                              const targetName = uniqueRoutes.find(r => r.id === selected)?.Route || 'Route';
                              toast({ title: 'Customer moved', description: `${c.customer} moved to route ${targetName}` });
                              await refreshGroupedRoutes();
                            } catch (e) {
                              const message = e instanceof Error ? e.message : 'Failed to move customer';
                              toast({ title: 'Move failed', description: message, variant: 'destructive' });
                            }
                          }}
                          disabled={!targetRouteId[c.id]}
                        >
                          Move
                        </Button>
                      </div>
                    </div>
                  ))}
                  {allCustomers.length === 0 && !customersLoading && (
                    <div className="p-4 text-gray-500 text-sm">No customers found.</div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
          <p className="text-gray-500">No routes are available for {selectedDay}</p>
        </div>
      )}

      {/* Routes and Customers Data */}
      {hasData && !loading && (
        <div className="space-y-4">
          {allRoutes.map((route) => (
            <Card
              key={route.id}
              className="border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-gray-900 text-lg">
                        Route {route.Route}
                      </span>
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
              </CardHeader>

              {/* Customer Details - Collapsible */}
              {expandedRoutes.has(route.Route) && route.customerGroups && route.customerGroups.length > 0 && (
                <CardContent className="bg-gray-50 border-gray-200 border-t">
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
                                <Dialog open={moveDialog.open && moveDialog.customerId === customer.id} onOpenChange={(open) => setMoveDialog(open ? { open, customerId: customer.id, customerName: customer.customer, currentCode: customer.code } : { open: false })}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">Move</Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl w-[720px]">
                                  <DialogHeader>
                                    <div className="flex justify-between items-center">
                                      <DialogTitle>Move {moveDialog.customerName}</DialogTitle>
                                      <button
                                        type="button"
                                        className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50"
                                        onClick={() => setMoveDialog({ open: false })}
                                      >
                                        Close
                                      </button>
                                    </div>
                                  </DialogHeader>
                                    <div className="space-y-3">
                                      <label className="block text-sm text-gray-700">Select target route</label>
                                      <select
                                        className="w-full border rounded px-3 py-2 text-sm"
                                        value={singleMoveTargetRouteId}
                                        onChange={(e) => setSingleMoveTargetRouteId(Number(e.target.value))}
                                      >
                                        <option value="" disabled>Select route</option>
                                        {routesLoading && <option value="" disabled>Loading routes...</option>}
                                        {!routesLoading && uniqueRoutes.map(r => (
                                          <option key={r.id} value={r.id}>{r.Route || 'Unnamed Route'}</option>
                                        ))}
                                      </select>
                                      <div className="flex justify-end gap-2 pt-2">
                                        <Button variant="outline" size="sm" onClick={() => setMoveDialog({ open: false })}>Cancel</Button>
                                        <Button
                                          size="sm"
                                          onClick={async () => {
                                            if (singleMoveTargetRouteId === '' || !customer.id) return;
                                            try {
                                              const res = await fetch('/api/routes/move-customer', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ customerId: customer.id, targetRouteId: singleMoveTargetRouteId })
                                              });
                                              const data = await res.json();
                                              if (!res.ok || !data.success) throw new Error(data.error || 'Failed to move');
                                              setMoveDialog({ open: false });
                                              setSingleMoveTargetRouteId('');
                                              await refreshGroupedRoutes();
                                          const movedName = customer.customer || 'Customer';
                                          const targetName = uniqueRoutes.find(r => r.id === singleMoveTargetRouteId)?.Route || 'Route';
                                          toast({ title: 'Customer moved', description: `${movedName} moved to route ${targetName}` });
                                            } catch (e) {
                                              const message = e instanceof Error ? e.message : 'Failed to move customer';
                                              toast({ title: 'Move failed', description: message, variant: 'destructive' });
                                            }
                                          }}
                                          disabled={singleMoveTargetRouteId === ''}
                                        >
                                          Move
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}





