'use client';

import React, { useState, useEffect } from 'react';
import { useRoutes } from '@/contexts/routes-context';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Users, MapPin } from 'lucide-react';

interface RouteAssignmentDropdownProps {
  onRouteSelect: (routeId: string, routeName: string) => void;
  onCustomerSelect: (customerId: string, customerName: string) => void;
}

export function RouteAssignmentDropdown({ onRouteSelect, onCustomerSelect }: RouteAssignmentDropdownProps) {
  const { todayLocationGroups, todayData, loadTodayRoutes, loading, error } = useRoutes();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Load today's routes on component mount
  useEffect(() => {
    if (todayLocationGroups.length === 0) {
      loadTodayRoutes();
    }
  }, [todayLocationGroups.length, loadTodayRoutes]);

  const toggleGroup = (locationCode: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(locationCode)) {
      newExpanded.delete(locationCode);
    } else {
      newExpanded.add(locationCode);
    }
    setExpandedGroups(newExpanded);
  };

  const handleRouteClick = (routeId: string, routeName: string) => {
    onRouteSelect(routeId, routeName);
    setIsOpen(false);
  };

  const handleCustomerClick = (customerId: string, customerName: string) => {
    onCustomerSelect(customerId, customerName);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="relative">
        <Button variant="outline" disabled className="justify-between w-full">
          <span>Loading routes...</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative">
        <Button variant="outline" disabled className="justify-between w-full text-red-600">
          <span>Error loading routes</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        onClick={() => setIsOpen(!isOpen)}
        className="justify-between w-full"
      >
        <span>
          {todayData ? `Routes for ${todayData.day} (${todayData.totalLocationGroups} groups)` : 'Select Route'}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="top-full right-0 left-0 z-50 absolute bg-white shadow-lg mt-1 border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
          {todayData && (
            <div className="bg-gray-50 p-3 border-gray-100 border-b">
              <div className="text-gray-600 text-sm">
                <strong>{todayData.day.charAt(0).toUpperCase() + todayData.day.slice(1)}</strong> - {todayData.date}
              </div>
               <div className="text-gray-500 text-xs">
                 {todayData.totalLocationGroups} location groups • {todayData.totalRoutes} routes • {todayData.totalCustomers} customers
               </div>
            </div>
          )}

          {todayLocationGroups.length === 0 ? (
            <div className="p-4 text-gray-500 text-sm text-center">
              No routes available for today
            </div>
          ) : (
            <div className="py-2">
              {todayLocationGroups.map((group) => (
                <div key={group.locationCode} className="border-gray-100 border-b last:border-b-0">
                  {/* Location Group Header */}
                  <div 
                    className="flex justify-between items-center hover:bg-gray-50 p-3 cursor-pointer"
                    onClick={() => toggleGroup(group.locationCode)}
                  >
                    <div className="flex items-center gap-3">
                      {group.customers.length > 0 ? (
                        <ChevronRight 
                          className={`w-4 h-4 text-gray-400 transition-transform ${
                            expandedGroups.has(group.locationCode) ? 'rotate-90' : ''
                          }`} 
                        />
                      ) : (
                        <div className="w-4 h-4" />
                      )}
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="font-medium text-gray-900">Location: {group.locationCode}</div>
                        <div className="text-gray-500 text-xs">{group.routes.length} route(s)</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Users className="w-3 h-3" />
                        <span>{group.customerCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Routes and Customers List */}
                  {expandedGroups.has(group.locationCode) && (
                    <div className="bg-gray-50 border-gray-100 border-t">
                      {/* Show routes in this location */}
                      {group.routes.map((route) => (
                        <div key={route.id} className="p-3 pl-8 border-gray-100 border-b last:border-b-0">
                          <div className="font-medium text-gray-800">{route.Route}</div>
                          <div className="text-gray-500 text-xs">Route ID: {route.RouteId}</div>
                        </div>
                      ))}
                      
                      {/* Show customers for this location */}
                      {group.customers.length > 0 && (
                        <div className="p-2 pl-8">
                          <div className="mb-2 font-medium text-gray-600 text-xs">Customers:</div>
                          {group.customers.map((customer) => (
                            <div 
                              key={customer.id}
                              className="flex justify-between items-center hover:bg-gray-100 p-2 border-gray-100 border-b last:border-b-0 rounded cursor-pointer"
                              onClick={() => handleCustomerClick(customer.id, customer.customer)}
                            >
                              <div>
                                <div className="font-medium text-gray-900">{customer.customer}</div>
                                <div className="text-gray-500 text-xs">
                                  {customer.avg_minutes ? `${customer.avg_minutes} min avg` : 'No timing data'}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCustomerClick(customer.id, customer.customer);
                                }}
                                className="text-xs"
                              >
                                Select
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* No customers message */}
                      {group.customers.length === 0 && (
                        <div className="bg-gray-50 p-3 pl-8 text-gray-500 text-sm">
                          No customers for this location today
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
