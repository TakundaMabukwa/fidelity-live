'use client';

import { useState, useMemo } from 'react';
import { Route } from '@/lib/types';
import { useRoutes } from '@/contexts/routes-context';
import { formatServiceDaysForDisplay } from '@/lib/utils/service-days';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface RoutesTableProps {
  onRouteClick?: (route: Route) => void;
}

export function RoutesTable({ onRouteClick }: RoutesTableProps) {
  const { routes, loading, error, loadRoutes, refreshRoutes, isLoaded, hasData } = useRoutes();
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const handleRouteClick = (route: Route) => {
    setSelectedRoute(route);
    onRouteClick?.(route);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter and paginate routes
  const filteredAndPaginatedRoutes = useMemo(() => {
    let filtered = routes;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(route =>
        route.Route?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.LocationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.userGroup?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.RouteId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(route => {
        if (statusFilter === 'active') return !route.Inactive;
        if (statusFilter === 'inactive') return route.Inactive;
        return true;
      });
    }

    // Calculate pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedRoutes = filtered.slice(startIndex, endIndex);

    return {
      routes: paginatedRoutes,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [routes, searchTerm, statusFilter, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  if (!isLoaded && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Routes Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="mb-4 text-gray-500">Click "Load Routes" to view routing information</p>
            <Button onClick={loadRoutes} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load Routes'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Routes Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Loader2 className="mx-auto mb-4 w-8 h-8 animate-spin" />
            <p>Loading routes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Routes Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="mb-4 text-red-500">{error}</p>
            <Button onClick={refreshRoutes} variant="outline">
              <RefreshCw className="mr-2 w-4 h-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle>Routes Information</CardTitle>
            {hasData && (
              <Badge variant="secondary" className="text-xs">
                {isLoaded ? 'Cached' : 'Loading...'}
              </Badge>
            )}
          </div>
          <Button onClick={refreshRoutes} variant="outline" size="sm">
            <RefreshCw className="mr-2 w-4 h-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex sm:flex-row flex-col gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
              <Input
                placeholder="Search routes..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Route</TableHead>
                <TableHead>Location Code</TableHead>
                <TableHead>Service Days</TableHead>
                <TableHead>User Group</TableHead>
                <TableHead>Week Number</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndPaginatedRoutes.routes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-gray-500 text-center">
                    No routes found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndPaginatedRoutes.routes.map((route) => (
                  <TableRow
                    key={route.id}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      selectedRoute?.id === route.id ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleRouteClick(route)}
                  >
                    <TableCell className="font-medium">{route.Route}</TableCell>
                    <TableCell>{route.LocationCode}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {formatServiceDaysForDisplay(route.ServiceDays)}
                    </TableCell>
                    <TableCell>{route.userGroup}</TableCell>
                    <TableCell>{route.WeekNumber}</TableCell>
                    <TableCell>{formatDate(route.StartDate)}</TableCell>
                    <TableCell>{formatDate(route.EndDate)}</TableCell>
                    <TableCell>
                      <Badge variant={route.Inactive ? 'destructive' : 'default'}>
                        {route.Inactive ? 'Inactive' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(route.LastUpdated)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="flex sm:flex-row flex-col justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-sm">Show</span>
            <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-gray-700 text-sm">entries</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-700 text-sm">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredAndPaginatedRoutes.totalItems)} of{' '}
              {filteredAndPaginatedRoutes.totalItems} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!filteredAndPaginatedRoutes.hasPrevPage}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, filteredAndPaginatedRoutes.totalPages) }, (_, i) => {
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
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!filteredAndPaginatedRoutes.hasNextPage}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
