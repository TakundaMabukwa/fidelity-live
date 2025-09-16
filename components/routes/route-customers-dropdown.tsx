'use client';

import React, { useState, useEffect } from 'react';
import { CustomerDuration } from '@/lib/types';
import { useCustomerDuration } from '@/contexts/customer-duration-context';
import { useRoutes } from '@/contexts/routes-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Package,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface RouteCustomersDropdownProps {
  locationCode: string;
  serviceDays: string[];
  routeName: string;
}

export function RouteCustomersDropdown({ 
  locationCode, 
  serviceDays, 
  routeName 
}: RouteCustomersDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5); // Show 5 customers per page
  const { 
    customers, 
    loading, 
    error, 
    pagination,
    loadCustomersByLocationCode,
    getCustomersByLocationCode 
  } = useCustomerDuration();
  
  // Use routes context for caching
  const { 
    getCachedCustomers, 
    getCachedPagination, 
    getAllCachedCustomers,
    isCustomerDataCached 
  } = useRoutes();

  const routeCustomers = getCustomersByLocationCode(locationCode);

  // Auto-load customers on mount to show count
  useEffect(() => {
    if (!hasLoaded) {
      // Check if we have cached data first
      if (isCustomerDataCached(locationCode)) {
        const cachedCustomers = getCachedCustomers(locationCode);
        const cachedPagination = getCachedPagination(locationCode);
        
        if (cachedCustomers && cachedPagination) {
          console.log('Using cached data for initial load of', locationCode);
          setHasLoaded(true);
          return;
        }
      }
      
      loadCustomersByLocationCode(locationCode, serviceDays, 1, pageSize);
      setHasLoaded(true);
    }
  }, [locationCode, serviceDays, hasLoaded, loadCustomersByLocationCode, pageSize, isCustomerDataCached, getCachedCustomers, getCachedPagination]);

  // Load customers when page changes
  useEffect(() => {
    if (hasLoaded && isExpanded) {
      loadCustomersByLocationCode(locationCode, serviceDays, currentPage, pageSize);
    }
  }, [currentPage, isExpanded, locationCode, serviceDays, loadCustomersByLocationCode, pageSize, hasLoaded]);

  const handleToggle = () => {
    if (!isExpanded) {
      setCurrentPage(1); // Reset to first page when expanding
    }
    setIsExpanded(!isExpanded);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };


  return (
    <div className="border rounded-lg">
      <div 
        className="flex justify-between items-center hover:bg-gray-50 p-4 transition-colors cursor-pointer"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-medium text-gray-900">{routeName}</h3>
            <p className="text-gray-500 text-sm">Location: {locationCode}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {loading && (
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
          )}
          <Badge variant="outline" className="text-xs">
            {pagination?.totalCount || getCachedPagination(locationCode)?.totalCount || routeCustomers.length} customers
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="ml-2 text-gray-600">Loading customers...</span>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="mb-2 text-red-600">Error loading customers</p>
              <p className="text-gray-500 text-sm">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadCustomersByLocationCode(locationCode, serviceDays)}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          ) : routeCustomers.length === 0 ? (
            <div className="py-8 text-center">
              <Users className="mx-auto mb-2 w-12 h-12 text-gray-300" />
              <p className="text-gray-500">No customers found for this location</p>
              <p className="text-gray-400 text-sm">Check if today is a service day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {routeCustomers.map((customer) => (
                <Card key={customer.id} className="bg-white">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="font-medium text-sm">
                        {customer.customer || 'Unknown Customer'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-600 text-xs">Stops:</span>
                          <span className="font-mono text-xs">{customer.stops || '0'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-between items-center pt-3 border-t">
                  <div className="text-gray-500 text-sm">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, pagination.totalCount)} of {pagination.totalCount} customers
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.hasPreviousPage || loading}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-gray-600 text-sm">
                      Page {currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.hasNextPage || loading}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

