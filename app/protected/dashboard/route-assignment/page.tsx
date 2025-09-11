'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { DataTable } from '@/components/common/data-table';
import { StatsCard } from '@/components/common/stats-card';
import { DayTabs } from '@/components/common/day-tabs';
import { useRouteAssignment } from '@/contexts/route-assignment-context';
import { useRoutes } from '@/contexts/routes-context';
import { useServiceDays } from '@/hooks/use-service-days';
import { TableColumn } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Route, Clock, Users, Calendar, ArrowLeft, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import LogisticsDashboard from '@/components/route-assignment';
import { RouteCards } from '@/components/route-assignment/route-cards';
import { MapboxRouteMap } from '@/components/route-assignment/mapbox-route-map';
import { useCustomersLocation } from '@/contexts/customers-location-context';
import { groupRoutesByLocation, sortRoutesByLocationCode, LocationGroup } from '@/lib/utils/location-grouping';

// Create dynamic columns that depend on selectedDay
const createRouteColumns = (
  selectedDay: string,
  hasDay: (serviceDays: string | null, targetDay: string) => boolean,
  parse: (serviceDays: string | null) => { isValid: boolean; days: string[] }
): TableColumn[] => [
  { key: 'Route', header: 'Route' },
  { key: 'LocationCode', header: 'Location Code' },
  {
    key: 'ServiceDays',
    header: 'Service Days',
    render: (value: unknown) => {
      const serviceDays = value as string | null;
      // Handle null, undefined, or empty values
      if (!serviceDays || serviceDays.trim() === '') {
        return <span className="text-gray-400 text-xs">No data</span>;
      }

      // Parse the comma-separated values
      const result = parse(serviceDays);
      
      if (!result.isValid) {
        return <span className="text-gray-400 text-xs">Invalid data</span>;
      }

      // Check if the selected day is in the service days
      const hasSelectedDay = hasDay(serviceDays, selectedDay);

      return (
        <div className="flex flex-wrap gap-1">
          {hasSelectedDay ? (
            <Badge variant="secondary" className="text-xs">
              {selectedDay}
            </Badge>
          ) : (
            <span className="text-gray-400 text-xs">No service</span>
          )}
        </div>
      );
    },
  },
  { key: 'userGroup', header: 'User Group' },
  { 
    key: 'created_at', 
    header: 'Created',
    render: (value: unknown) => {
      const date = value as string;
      return new Date(date).toLocaleDateString();
    }
  },
];

export default function RouteAssignmentPage() {
  const { loadRouteAssignments } = useRouteAssignment();
  const { routes, loading: routesLoading, error: routesError, loadRoutes, refreshRoutes, isLoaded, hasData } = useRoutes();
  const { locations, loading: locationsLoading, error: locationsError, loadLocations, isLoaded: locationsLoaded } = useCustomersLocation();
  const { hasDay, parse, filterRoutesByDay } = useServiceDays();
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [currentView, setCurrentView] = useState<'routes' | 'assignment'>('routes');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>();
  const [groupedRoutes, setGroupedRoutes] = useState<LocationGroup[]>([]);
  const prevGroupingData = useRef<{ routesLength: number; locationsLength: number; currentView: string }>({
    routesLength: 0,
    locationsLength: 0,
    currentView: 'routes'
  });

  // Get current day of the week
  const getCurrentDay = () => {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[today.getDay()];
  };

  // Initialize with current day
  useEffect(() => {
    setSelectedDay(getCurrentDay());
  }, []);

  // Auto-load routes data if not already loaded
  useEffect(() => {
    if (!isLoaded && !routesLoading) {
      loadRoutes();
    }
    if (!locationsLoaded && !locationsLoading) {
      loadLocations();
    }
    loadRouteAssignments();
  }, [isLoaded, routesLoading, loadRoutes, loadRouteAssignments, locationsLoaded, locationsLoading, loadLocations]);

  // Filter routes for selected day using utility function
  const filteredRoutes = useMemo(() => {
    return filterRoutesByDay(routes, selectedDay);
  }, [routes, selectedDay, filterRoutesByDay]);

  // Group routes by location when switching to assignment view
  useEffect(() => {
    const currentData = {
      routesLength: filteredRoutes.length,
      locationsLength: locations.length,
      currentView: currentView
    };

    // Check if we need to update grouping
    const shouldUpdate = 
      currentView !== prevGroupingData.current.currentView ||
      (currentView === 'assignment' && 
       (filteredRoutes.length !== prevGroupingData.current.routesLength ||
        locations.length !== prevGroupingData.current.locationsLength));

    if (shouldUpdate) {
      if (currentView === 'assignment' && filteredRoutes.length > 0 && locations.length > 0) {
        console.log('Grouping routes by location...');
        const sortedRoutes = sortRoutesByLocationCode(filteredRoutes);
        const groups = groupRoutesByLocation(sortedRoutes, locations);
        setGroupedRoutes(groups);
        console.log(`Created ${groups.length} location groups`);
      } else if (currentView === 'routes') {
        // Clear grouped routes when switching back to routes view
        setGroupedRoutes([]);
      }

      // Update the ref with current data
      prevGroupingData.current = currentData;
    }
  }, [currentView, filteredRoutes, locations]);

  // Memoized paginated data
  const paginatedRoutes = useMemo(() => {
    const totalItems = filteredRoutes.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredRoutes.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      totalItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [filteredRoutes, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    refreshRoutes();
  };

  const stats = [
    { 
      title: 'Total Routes', 
      value: routes.length.toString(), 
      color: 'blue' as const, 
      icon: <Route className="w-5 h-5" /> 
    },
    { 
      title: `${selectedDay} Routes`, 
      value: filteredRoutes.length.toString(), 
      color: 'green' as const, 
      icon: <Calendar className="w-5 h-5" /> 
    },
    { 
      title: 'User Groups', 
      value: '2', 
      color: 'orange' as const, 
      icon: <Users className="w-5 h-5" /> 
    },
    { 
      title: 'Last Updated', 
      value: '9/2/2025', 
      color: 'purple' as const, 
      icon: <Clock className="w-5 h-5" /> 
    },
  ];

  // Error state
  if (routesError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-slate-800 text-3xl">ROUTE ASSIGNMENT</h1>
          <p className="mt-1 text-gray-600">Manage and assign routes by day of the week</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mb-4 text-red-500">
                <Route className="mx-auto mb-2 w-12 h-12" />
                <h3 className="font-semibold text-lg">Error Loading Routes</h3>
                <p className="text-gray-600 text-sm">{routesError}</p>
              </div>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="mr-2 w-4 h-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (!isLoaded && routesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-slate-800 text-3xl">ROUTE ASSIGNMENT</h1>
          <p className="mt-1 text-gray-600">Manage and assign routes by day of the week</p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Loading Routes...
              </CardTitle>
              <div className="flex gap-2">
                <Skeleton className="w-20 h-8" />
                <Skeleton className="w-20 h-8" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="gap-4 grid grid-cols-5 bg-gray-50 p-4 rounded-lg">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="w-full h-4" />
                ))}
              </div>
              
              {Array.from({ length: 10 }, (_, rowIndex) => (
                <div key={rowIndex} className="gap-4 grid grid-cols-5 p-4 border-b">
                  {Array.from({ length: 5 }, (_, colIndex) => (
                    <Skeleton key={colIndex} className="w-full h-4" />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-bold text-slate-800 text-3xl">ROUTE ASSIGNMENT</h1>
          <p className="mt-1 text-gray-600">
            Manage and assign routes by day of the week - currently showing {selectedDay}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            Current Role: manager
          </Button>
          {currentView === 'routes' ? (
            <Button 
              className="bg-slate-800 hover:bg-slate-700"
              onClick={() => setCurrentView('assignment')}
            >
              Assign Routes
            </Button>
          ) : (
            <Button 
              variant="outline"
              onClick={() => setCurrentView('routes')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Routes
            </Button>
          )}
        </div>
      </div>

      {currentView === 'routes' ? (
        <>
          {/* Day Tabs */}
          <div className="bg-white border rounded-lg">
            <DayTabs selectedDay={selectedDay} onDayChange={setSelectedDay} />
          </div>

          <div className="bg-green-50 p-4 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <div className="flex justify-center items-center bg-green-500 rounded-full w-5 h-5">
                <span className="text-white text-xs">✓</span>
              </div>
              <div>
                <p className="font-medium">Routes Available for {selectedDay}</p>
                <p className="text-sm">
                  {filteredRoutes.length} routes found for {selectedDay} 
                  {selectedDay === getCurrentDay() ? ' (Today)' : ''}
                </p>
              </div>
            </div>
          </div>

          <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Route className="w-5 h-5" />
                    Routes for {selectedDay}{selectedDay === getCurrentDay() ? ' (Today)' : ''} ({paginatedRoutes.totalItems})
                  </CardTitle>
                  {hasData && (
                    <Badge variant="secondary" className="text-xs">
                      {isLoaded ? 'Cached' : 'Loading...'}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleRefresh} variant="outline" size="sm">
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <DataTable
                data={paginatedRoutes.data}
                columns={createRouteColumns(selectedDay, hasDay, parse)}
                loading={routesLoading}
              />

              {/* Pagination Controls */}
              <div className="flex sm:flex-row flex-col justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 text-sm">Show</span>
                  <select 
                    value={itemsPerPage.toString()} 
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className="px-2 border border-gray-300 rounded-md w-20 h-8 text-sm"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                  <span className="text-gray-700 text-sm">entries</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-gray-700 text-sm">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, paginatedRoutes.totalItems)} of{' '}
                    {paginatedRoutes.totalItems} entries
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!paginatedRoutes.hasPrevPage}
                    className="p-0 w-8 h-8"
                  >
                    ←
                  </Button>
                  
                  {Array.from({ length: Math.min(5, paginatedRoutes.totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    const isActive = pageNum === currentPage;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="p-0 w-8 h-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!paginatedRoutes.hasNextPage}
                    className="p-0 w-8 h-8"
                  >
                    →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="space-y-6">
          {/* Loading state for locations */}
          {locationsLoading && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="border-b-2 border-blue-600 rounded-full w-6 h-6 animate-spin"></div>
                  <span className="text-gray-600">Loading location data...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error state for locations */}
          {locationsError && (
            <Card>
              <CardContent className="p-6">
                <div className="text-red-600 text-center">
                  <h3 className="mb-2 font-semibold">Error Loading Locations</h3>
                  <p className="text-sm">{locationsError}</p>
                  <Button 
                    onClick={loadLocations} 
                    variant="outline" 
                    className="mt-3"
                  >
                    Retry
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Route Cards View */}
          {!locationsLoading && !locationsError && groupedRoutes.length > 0 && (
            <RouteCards
              groups={groupedRoutes}
              selectedGroupId={selectedGroupId}
              onGroupSelect={(group) => setSelectedGroupId(group.id)}
              onRouteSelect={(route) => {
                console.log('Selected route:', route);
                // Handle route selection for assignment
              }}
            />
          )}

          {/* Mapbox Map View */}
          {!locationsLoading && !locationsError && groupedRoutes.length > 0 && (
            <MapboxRouteMap
              groups={groupedRoutes}
              selectedGroupId={selectedGroupId}
              onGroupSelect={(group) => setSelectedGroupId(group.id)}
            />
          )}

          {/* No routes available */}
          {!locationsLoading && !locationsError && groupedRoutes.length === 0 && filteredRoutes.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Route className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                <h3 className="mb-2 font-medium text-gray-900 text-lg">No Routes Available</h3>
                <p className="text-gray-600">
                  No routes found for {selectedDay}. Please check your route data or try a different day.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Fallback to original dashboard if no location data */}
          {!locationsLoading && !locationsError && locations.length === 0 && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="p-6">
                <div className="mb-4">
                  <h2 className="mb-2 font-bold text-gray-900 text-xl">Route Assignment Dashboard</h2>
                  <p className="text-gray-600">No location data available. Using basic assignment view.</p>
                </div>
                <LogisticsDashboard />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}