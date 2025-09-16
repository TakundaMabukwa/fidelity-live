'use client';

import React, { useState } from 'react';
import { useGroupedRoutes } from '@/contexts/grouped-routes-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, MapPin, Users, Clock, Route, RefreshCw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ContextGroupedRoutesProps {
  className?: string;
}

export function ContextGroupedRoutes({ className }: ContextGroupedRoutesProps) {
  const { groupedRoutes, loading, error, refreshGroupedRoutes, isLoaded, hasData } = useGroupedRoutes();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (locationCode: string) => {
    const newOpenGroups = new Set(openGroups);
    if (newOpenGroups.has(locationCode)) {
      newOpenGroups.delete(locationCode);
    } else {
      newOpenGroups.add(locationCode);
    }
    setOpenGroups(newOpenGroups);
  };

  const formatDuration = (seconds: number | null, minutes: number | null) => {
    if (minutes !== null && minutes > 0) {
      return `${minutes} min`;
    }
    if (seconds !== null && seconds > 0) {
      return `${Math.round(seconds / 60)} min`;
    }
    return 'N/A';
  };

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
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
      </div>
    );
  }

  if (loading && !isLoaded) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Loading Skeleton */}
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
        <div className="py-4 text-center">
          <div className="mb-2 text-gray-400">
            <RefreshCw className="mx-auto w-6 h-6 animate-spin" />
          </div>
          <p className="text-gray-500 text-sm">Loading routes and customers...</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="py-8 text-center">
          <div className="mb-4 text-gray-400">
            <Route className="mx-auto w-12 h-12" />
          </div>
          <h3 className="mb-2 font-medium text-gray-900 text-lg">No routes found</h3>
          <p className="text-gray-500">No grouped routes are available at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with refresh button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">Grouped Routes & Customers</h3>
          <p className="text-gray-600 text-sm">
            {groupedRoutes.length} location groups with {groupedRoutes.reduce((sum, group) => sum + group.routes.length, 0)} total routes
          </p>
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

      {/* Route Groups */}
      <div className="space-y-3">
        {groupedRoutes.map((group) => (
          <Card key={group.locationCode} className="border border-gray-200">
            <Collapsible
              open={openGroups.has(group.locationCode)}
              onOpenChange={() => toggleGroup(group.locationCode)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {openGroups.has(group.locationCode) ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg">
                          {group.locationCode}
                        </CardTitle>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {group.routes.length} routes
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {group.customers.length} customers
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Routes Section */}
                    <div>
                      <h4 className="flex items-center mb-3 font-medium text-gray-900">
                        <Route className="mr-2 w-4 h-4" />
                        Routes ({group.routes.length})
                      </h4>
                      <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {group.routes.map((route) => (
                          <div
                            key={route.id}
                            className="bg-gray-50 p-3 border border-gray-200 rounded-lg"
                          >
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm">{route.Route}</span>
                                <Badge 
                                  variant={route.Inactive ? "destructive" : "default"}
                                  className="text-xs"
                                >
                                  {route.Inactive ? 'Inactive' : 'Active'}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-gray-600 text-xs">
                                <div>Service Days: {route.ServiceDays || 'N/A'}</div>
                                <div>User Group: {route.userGroup || 'N/A'}</div>
                                <div>Week: {route.WeekNumber || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customers Section */}
                    <div>
                      <h4 className="flex items-center mb-3 font-medium text-gray-900">
                        <Users className="mr-2 w-4 h-4" />
                        Customers ({group.customers.length})
                      </h4>
                      {group.customers.length > 0 ? (
                        <div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                          {group.customers.map((customer) => (
                            <div
                              key={customer.id}
                              className="bg-blue-50 p-3 border border-gray-200 rounded-lg"
                            >
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-sm">{customer.customer}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {customer.code}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-gray-600 text-xs">
                                  <div className="flex items-center">
                                    <Clock className="mr-1 w-3 h-3" />
                                    Avg Duration: {formatDuration(customer.avg_seconds, customer.avg_minutes)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-4 text-gray-500 text-sm text-center">
                          No customers found for this location code
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}
