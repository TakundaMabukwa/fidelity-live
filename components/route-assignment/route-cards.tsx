'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Route, MapPin, Calendar, Users, Package } from 'lucide-react';
import { LocationGroup } from '@/lib/utils/location-grouping';
import { useServiceDays } from '@/hooks/use-service-days';

interface RouteCardsProps {
  groups: LocationGroup[];
  selectedGroupId?: string;
  onGroupSelect?: (group: LocationGroup) => void;
  onRouteSelect?: (route: any) => void;
}

export function RouteCards({ groups, selectedGroupId, onGroupSelect, onRouteSelect }: RouteCardsProps) {
  const { hasDay, parse } = useServiceDays();

  const getCurrentDay = () => {
    const today = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[today.getDay()];
  };

  const currentDay = getCurrentDay();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-gray-900 text-2xl">Route Assignment Dashboard</h2>
          <p className="text-gray-600">
            Routes for {currentDay} - Grouped by location proximity
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {groups.length} groups • {groups.reduce((sum, group) => sum + group.routes.length, 0)} total routes
        </Badge>
      </div>

      {groups.map((group, groupIndex) => (
        <Card 
          key={group.id} 
          className={`transition-all ${
            selectedGroupId === group.id 
              ? 'ring-2 ring-blue-500 shadow-lg' 
              : 'hover:shadow-md'
          }`}
          style={{ borderLeftColor: group.color, borderLeftWidth: '4px' }}
        >
          <CardHeader 
            className="cursor-pointer"
            onClick={() => onGroupSelect?.(group)}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div 
                  className="flex justify-center items-center rounded-full w-6 h-6 font-bold text-white text-sm"
                  style={{ backgroundColor: group.color }}
                >
                  {groupIndex + 1}
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Location Group {groupIndex + 1}
                  </CardTitle>
                  <p className="text-gray-600 text-sm">
                    {group.routes.length} routes • 
                    {group.centerLat !== 0 && group.centerLon !== 0 
                      ? ` ${group.centerLat.toFixed(4)}, ${group.centerLon.toFixed(4)}`
                      : ' No location data'
                    }
                  </p>
                </div>
              </div>
              <Badge variant="secondary">
                {group.routes.length} routes
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {group.routes.map((route, routeIndex) => (
                <Card 
                  key={`${group.id}-${route.Route}`}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onRouteSelect?.(route)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Route className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-sm">{route.Route}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          #{routeIndex + 1}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <MapPin className="w-3 h-3" />
                          <span>{route.LocationCode || 'No location code'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Calendar className="w-3 h-3" />
                          <div className="flex flex-wrap gap-1">
                            {route.ServiceDays ? (
                              (() => {
                                const result = parse(route.ServiceDays);
                                if (result.isValid && result.days.length > 0) {
                                  return result.days.map((day: string) => (
                                    <Badge 
                                      key={day}
                                      variant={hasDay(route.ServiceDays, currentDay) ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {day}
                                    </Badge>
                                  ));
                                }
                                return <span className="text-gray-400 text-xs">No service days</span>;
                              })()
                            ) : (
                              <span className="text-gray-400 text-xs">No service days</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Users className="w-3 h-3" />
                          <span>{route.userGroup || 'No user group'}</span>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Package className="w-3 h-3" />
                          <span>Created: {new Date(route.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRouteSelect?.(route);
                          }}
                        >
                          Assign Route
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {groups.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Route className="mx-auto mb-4 w-12 h-12 text-gray-400" />
            <h3 className="mb-2 font-medium text-gray-900 text-lg">No Routes Available</h3>
            <p className="text-gray-600">
              No routes found for {currentDay}. Please check your route data or try a different day.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
