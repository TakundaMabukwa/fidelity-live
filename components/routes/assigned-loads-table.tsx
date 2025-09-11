'use client';

import { useState, useMemo, useEffect } from 'react';
import { AssignedLoad } from '@/lib/types';
import { useAssignedLoads } from '@/contexts/assigned-loads-context';
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

export function AssignedLoadsTable() {
  const { assignedLoads, loading, error, loadAssignedLoads, refreshAssignedLoads, isLoaded, hasData } = useAssignedLoads();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'pending'>('all');

  // Auto-load data when component mounts
  useEffect(() => {
    if (!isLoaded && !loading) {
      loadAssignedLoads();
    }
  }, [isLoaded, loading, loadAssignedLoads]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filter and paginate assigned loads
  const filteredAndPaginatedLoads = useMemo(() => {
    let filtered = assignedLoads;

    // Apply search filter (case-insensitive)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(load =>
        load.route_name?.toLowerCase().includes(searchLower) ||
        load.location_code?.toLowerCase().includes(searchLower) ||
        load.location_name?.toLowerCase().includes(searchLower) ||
        load.name?.toLowerCase().includes(searchLower) ||
        load.display?.toLowerCase().includes(searchLower) ||
        load.status?.toLowerCase().includes(searchLower) ||
        load.description?.toLowerCase().includes(searchLower) ||
        load.external_key?.toLowerCase().includes(searchLower) ||
        load.reject_fault?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(load => {
        const status = load.status?.toLowerCase();
        if (statusFilter === 'active') return status === 'active' || status === 'in_progress';
        if (statusFilter === 'completed') return status === 'completed' || status === 'done';
        if (statusFilter === 'pending') return status === 'pending' || status === 'queued';
        return true;
      });
    }

    // Calculate pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedLoads = filtered.slice(startIndex, endIndex);

    return {
      loads: paginatedLoads,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }, [assignedLoads, searchTerm, statusFilter, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: 'all' | 'active' | 'completed' | 'pending') => {
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

  const getStatusBadgeVariant = (status: string | null | undefined) => {
    if (!status) return 'secondary';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('completed') || statusLower.includes('done')) return 'default';
    if (statusLower.includes('active') || statusLower.includes('in_progress')) return 'secondary';
    if (statusLower.includes('pending') || statusLower.includes('queued')) return 'outline';
    return 'secondary';
  };

  if (!isLoaded && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Loads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="mb-4 text-gray-500">Loading assigned loads...</p>
            <Loader2 className="mx-auto mb-4 w-8 h-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Loads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Loader2 className="mx-auto mb-4 w-8 h-8 animate-spin" />
            <p>Loading assigned loads...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Loads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="mb-4 text-red-500">{error}</p>
            <Button onClick={refreshAssignedLoads} variant="outline">
              <RefreshCw className="mr-2 w-4 h-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show "No routes for today" when data is loaded but empty
  if (isLoaded && assignedLoads.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assigned Loads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <div className="bg-gray-50 p-6 border rounded-lg">
              <div className="mb-2 font-medium text-gray-500 text-lg">No routes for today</div>
              <p className="text-gray-400 text-sm">
                There are no assigned loads available for today. Upload a report to add routes.
              </p>
            </div>
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
            <CardTitle>Assigned Loads</CardTitle>
            {hasData && (
              <Badge variant="secondary" className="text-xs">
                {isLoaded ? 'Cached' : 'Loading...'}
              </Badge>
            )}
          </div>
          <Button onClick={refreshAssignedLoads} variant="outline" size="sm">
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
                placeholder="Search assigned loads..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-md">
          <Table>
             <TableHeader>
               <TableRow>
                 <TableHead>Route Name</TableHead>
                 <TableHead>Location</TableHead>
                 <TableHead>Name</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>Reject Fault</TableHead>
                 <TableHead>Day</TableHead>
                 <TableHead>Created</TableHead>
               </TableRow>
             </TableHeader>
            <TableBody>
               {filteredAndPaginatedLoads.loads.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={7} className="py-8 text-gray-500 text-center">
                     {isLoaded && assignedLoads.length === 0 ? 'No routes for today' : 'No assigned loads found'}
                   </TableCell>
                 </TableRow>
               ) : (
                filteredAndPaginatedLoads.loads.map((load) => (
                  <TableRow key={load.id}>
                    <TableCell className="font-medium">{load.route_name || 'N/A'}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{load.location_name || 'N/A'}</div>
                        <div className="text-gray-500 text-sm">{load.location_code || ''}</div>
                      </div>
                    </TableCell>
                    <TableCell>{load.name || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(load.status)}>
                        {load.status || 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        {load.reject_fault || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{load.day || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(load.created)}</TableCell>
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
              {Math.min(currentPage * itemsPerPage, filteredAndPaginatedLoads.totalItems)} of{' '}
              {filteredAndPaginatedLoads.totalItems} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!filteredAndPaginatedLoads.hasPrevPage}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, filteredAndPaginatedLoads.totalPages) }, (_, i) => {
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
              disabled={!filteredAndPaginatedLoads.hasNextPage}
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
