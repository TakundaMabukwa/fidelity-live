'use client';

import React, { useState, useEffect } from 'react';
import { GroupedRoute, CustomerStop } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, MapPin, Users, Clock, Route } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface GroupedRoutesProps {
  className?: string;
}

export function GroupedRoutes({ className }: GroupedRoutesProps) {
  const [groupedRoutes, setGroupedRoutes] = useState<GroupedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoutes, setExpandedRoutes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchGroupedRoutes();
  }, []);

  const fetchGroupedRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/routes/grouped');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch grouped routes');
      }
      
      setGroupedRoutes(data.data || []);
    } catch (err) {
      console.error('Error fetching grouped routes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch grouped routes');
    } finally {
      setLoading(false);
    }
  };

  const toggleRoute = (locationCode: string) => {
    const newExpanded = new Set(expandedRoutes);
    if (newExpanded.has(locationCode)) {
      newExpanded.delete(locationCode);
    } else {
      newExpanded.add(locationCode);
    }
    setExpandedRoutes(newExpanded);
  };

  const formatServiceDays = (serviceDays: string | null) => {
    if (!serviceDays) return 'No service days';
    return serviceDays.split(',').map(day => day.trim()).join(', ');
  };

  const formatDuration = (seconds: number | null, minutes: number | null) => {
    if (seconds && minutes) {
      return `${minutes}m ${seconds}s`;
    } else if (minutes) {
      return `${minutes}m`;
    } else if (seconds) {
      return `${seconds}s`;
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex justify-center items-center p-8">
          <div className="border-b-2 border-blue-600 rounded-full w-8 h-8 animate-spin"></div>
          <span className="ml-2 text-gray-600">Loading routes...</span>
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
              <p className="font-medium">Error loading routes</p>
              <p className="mt-1 text-sm">{error}</p>
              <Button 
                onClick={fetchGroupedRoutes} 
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

  if (groupedRoutes.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-gray-600 text-center">
              <Route className="mx-auto mb-4 w-12 h-12 text-gray-400" />
              <p className="font-medium">No routes found</p>
              <p className="mt-1 text-sm">No grouped routes are available at the moment.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-gray-900 text-2xl">Grouped Routes</h2>
        <Button onClick={fetchGroupedRoutes} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {groupedRoutes.map((group) => (
        <Card key={group.locationCode} className="overflow-hidden">
          <Collapsible 
            open={expandedRoutes.has(group.locationCode)}
            onOpenChange={() => toggleRoute(group.locationCode)}
          >
            <CollapsibleTrigger asChild>
              <CardHeader className="hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">
                        Location Code: {group.locationCode}
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-1 text-gray-600 text-sm">
                        <span className="flex items-center">
                          <Route className="mr-1 w-4 h-4" />
                          {group.routes.length} route{group.routes.length !== 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center">
                          <Users className="mr-1 w-4 h-4" />
                          {group.customers.length} customer{group.customers.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {expandedRoutes.has(group.locationCode) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0">
                <div className="space-y-6">
                  {/* Routes Section */}
                  <div>
                    <h3 className="flex items-center mb-3 font-semibold text-lg">
                      <Route className="mr-2 w-5 h-5 text-blue-600" />
                      Routes ({group.routes.length})
                    </h3>
                    <div className="gap-3 grid">
                      {group.routes.map((route, index) => (
                        <div key={`${route.id}-${index}`} className="bg-gray-50 p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{route.Route}</h4>
                              <div className="space-y-1 mt-2 text-gray-600 text-sm">
                                <div className="flex items-center">
                                  <span className="w-24 font-medium">Service Days:</span>
                                  <Badge variant="secondary" className="ml-2">
                                    {formatServiceDays(route.ServiceDays)}
                                  </Badge>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-24 font-medium">User Group:</span>
                                  <span className="ml-2">{route.userGroup || 'N/A'}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-24 font-medium">Week Number:</span>
                                  <span className="ml-2">{route.WeekNumber || 'N/A'}</span>
                                </div>
                                <div className="flex items-center">
                                  <span className="w-24 font-medium">Status:</span>
                                  <Badge 
                                    variant={route.Inactive ? "destructive" : "default"}
                                    className="ml-2"
                                  >
                                    {route.Inactive ? 'Inactive' : 'Active'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customers Section */}
                  <div>
                    <h3 className="flex items-center mb-3 font-semibold text-lg">
                      <Users className="mr-2 w-5 h-5 text-green-600" />
                      Customers ({group.customers.length})
                    </h3>
                    {group.customers.length > 0 ? (
                      <div className="gap-3 grid">
                        {group.customers.map((customer) => (
                          <div key={customer.id} className="bg-green-50 p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{customer.customer}</h4>
                                <div className="space-y-1 mt-2 text-gray-600 text-sm">
                                  <div className="flex items-center">
                                    <span className="w-24 font-medium">Code:</span>
                                    <Badge variant="outline" className="ml-2">
                                      {customer.code || 'N/A'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="mr-1 w-4 h-4" />
                                    <span className="w-24 font-medium">Avg Duration:</span>
                                    <span className="ml-2">
                                      {formatDuration(customer.avg_seconds, customer.avg_minutes)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-gray-500 text-center">
                        <Users className="mx-auto mb-2 w-12 h-12 text-gray-400" />
                        <p>No customers found for this location code</p>
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
  );
}


