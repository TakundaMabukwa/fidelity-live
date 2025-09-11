'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/common/data-table';
import { StatsCard } from '@/components/common/stats-card';
import { DayTabs } from '@/components/common/day-tabs';
import { useRoutes } from '@/contexts/routes-context';
import { useServiceDays } from '@/hooks/use-service-days';
import { parseServiceDays, hasServiceDay } from '@/lib/utils/service-days';
import { TableColumn } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UploadReport } from '@/components/routes/upload-report';
import { AssignedLoadsTable } from '@/components/routes/assigned-loads-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AssignedLoadsProvider } from '@/contexts/assigned-loads-context';

// Create dynamic columns that depend on selectedDay
const createRouteColumns = (selectedDay: string): TableColumn[] => [
  { key: 'Route', header: 'Route' },
  { key: 'LocationCode', header: 'Location Code' },
  {
    key: 'ServiceDays',
    header: 'Service Days',
    render: (serviceDays: string | null) => {
      // Handle null, undefined, or empty values
      if (!serviceDays || serviceDays.trim() === '') {
        return <span className="text-gray-400 text-xs">No data</span>;
      }

      // Parse the comma-separated values
      const result = parseServiceDays(serviceDays);
      
      if (!result.isValid) {
        return <span className="text-gray-400 text-xs">Invalid data</span>;
      }

      // Check if the selected day is in the service days
      const hasSelectedDay = hasServiceDay(serviceDays, selectedDay);

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
    render: (date: string) => new Date(date).toLocaleDateString()
  },
];

function RoutesContent() {
  const { routes, loading, loadRoutes } = useRoutes();
  const { hasDay, parse, filterRoutesByDay, getStats } = useServiceDays();
  const [selectedDay, setSelectedDay] = useState<string>('');
  
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

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  // Filter routes for selected day using hook
  const filteredRoutes = filterRoutesByDay(routes, selectedDay);

  // Group routes by route name
  const groupedRoutes = filteredRoutes.reduce((groups, route) => {
    const routeName = route.Route || 'Unknown Route';
    if (!groups[routeName]) {
      groups[routeName] = [];
    }
    groups[routeName].push(route);
    return groups;
  }, {} as Record<string, typeof filteredRoutes>);

  const handleUploadComplete = () => {
    // Refresh routes data after successful upload
    loadRoutes();
  };

  const stats = [
    { 
      title: 'Total Routes', 
      value: routes.length.toString(), 
      color: 'blue' as const 
    },
    { 
      title: `${selectedDay} Routes`, 
      value: filteredRoutes.length.toString(), 
      color: 'green' as const 
    },
    { 
      title: 'Unique Route Groups', 
      value: Object.keys(groupedRoutes).length.toString(), 
      color: 'orange' as const 
    },
    { 
      title: 'Last Updated', 
      value: '9/2/2025', 
      color: 'purple' as const 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-bold text-slate-800 text-3xl">ROUTES</h1>
          <p className="mt-1 text-gray-600">
            View routes by day of the week - currently showing {selectedDay}
          </p>
        </div>
        <UploadReport onUploadComplete={handleUploadComplete} />
      </div>

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

      <div className="space-y-4">
        <h2 className="font-semibold text-gray-800 text-xl">
          Routes for {selectedDay}{selectedDay === getCurrentDay() ? ' (Today)' : ''}
        </h2>
        
        {Object.keys(groupedRoutes).length === 0 ? (
          <div className="bg-gray-50 p-8 border rounded-lg text-center">
            <p className="text-gray-500">No routes found for {selectedDay}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedRoutes).map(([routeName, routeGroup]) => (
              <div key={routeName} className="bg-white p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium text-gray-800 text-lg">{routeName}</h3>
                  <Badge variant="secondary" className="text-sm">
                    {routeGroup.length} {routeGroup.length === 1 ? 'route' : 'routes'}
                  </Badge>
                </div>
                
                <div className="gap-3 grid">
                  {routeGroup.map((route, index) => (
                    <div key={route.id || index} className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center space-x-4">
                        <div>
                          <span className="font-medium text-gray-700">{route.LocationCode || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {route.ServiceDays && (
                            <div className="flex flex-wrap gap-1">
                              {hasServiceDay(route.ServiceDays, selectedDay) ? (
                                <Badge variant="secondary" className="text-xs">
                                  {selectedDay}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-xs">No service</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-600 text-sm">{route.userGroup || 'N/A'}</span>
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm">
                        {new Date(route.created_at).toLocaleDateString()}
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
  );
}

export default function RoutesPage() {
  return (
    <AssignedLoadsProvider>
      <div className="space-y-6">
        <Tabs defaultValue="routes" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="routes">Routes</TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
          </TabsList>
          
          <TabsContent value="routes" className="mt-6">
            <RoutesContent />
          </TabsContent>
          
          <TabsContent value="assigned" className="mt-6">
            <AssignedLoadsTable />
          </TabsContent>
        </Tabs>
      </div>
    </AssignedLoadsProvider>
  );
}