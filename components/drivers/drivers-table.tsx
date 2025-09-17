'use client';

import React, { useState, useMemo } from 'react';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDrivers } from '@/contexts/drivers-context';
import { Driver } from '@/lib/types';
import { TableColumn } from '@/lib/types';
import { Search, RefreshCw, Download, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { updateDriver } from '@/lib/actions/drivers';

const createDriverColumns = (): TableColumn<Driver>[] => [
  {
    key: 'no',
    header: 'No',
    sortable: true,
  },
  {
    key: 'comp_no',
    header: 'Company No',
    render: (value: string | null) => (
      <span className="text-sm">
        {value || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'surname',
    header: 'Surname',
    render: (value: string | null) => (
      <span className="font-medium">
        {value || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'initial',
    header: 'Initial',
    render: (value: string | null) => (
      <span className="text-sm">
        {value || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'full_names',
    header: 'Full Names',
    render: (value: string | null) => (
      <span className="text-sm">
        {value || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'cell',
    header: 'Cell Phone',
    render: (value: string | null) => (
      <span className="text-sm">
        {value || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
];

export function DriversTable() {
  const { drivers, loading, error, loadDrivers, refreshDrivers, isLoaded, hasData } = useDrivers();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-load data on component mount
  React.useEffect(() => {
    if (!isLoaded && !loading) {
      loadDrivers();
    }
  }, [isLoaded, loading, loadDrivers]);

  // Memoized filtered and paginated data
  const filteredAndPaginatedDrivers = useMemo(() => {
    let filtered = drivers;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(driver => 
        driver.surname?.toLowerCase().includes(searchLower) ||
        driver.full_names?.toLowerCase().includes(searchLower) ||
        driver.comp_no?.toLowerCase().includes(searchLower) ||
        driver.cell?.toLowerCase().includes(searchLower)
      );
    }

    // Calculate pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      totalItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [drivers, searchTerm, currentPage, itemsPerPage]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleRefresh = () => {
    refreshDrivers();
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export drivers data');
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <User className="mx-auto mb-2 w-12 h-12" />
              <h3 className="font-semibold text-lg">Error Loading Drivers</h3>
              <p className="text-gray-600 text-sm">{error}</p>
            </div>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 w-4 h-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isLoaded && loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Drivers
            </CardTitle>
            <div className="flex gap-2">
              <Skeleton className="w-20 h-8" />
              <Skeleton className="w-20 h-8" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search Filter Skeleton */}
          <div className="flex sm:flex-row flex-col gap-4">
            <div className="flex-1">
              <Skeleton className="w-full h-10" />
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="space-y-3">
            {/* Table Header Skeleton */}
            <div className="gap-4 grid grid-cols-6 bg-gray-50 p-4 rounded-lg">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="w-full h-4" />
              ))}
            </div>
            
            {/* Table Rows Skeleton */}
            {Array.from({ length: 10 }, (_, rowIndex) => (
              <div key={rowIndex} className="gap-4 grid grid-cols-6 p-4 border-b">
                {Array.from({ length: 6 }, (_, colIndex) => (
                  <Skeleton key={colIndex} className="w-full h-4" />
                ))}
              </div>
            ))}
          </div>

          {/* Pagination Skeleton */}
          <div className="flex sm:flex-row flex-col justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-16 h-4" />
              <Skeleton className="w-20 h-8" />
              <Skeleton className="w-16 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-32 h-4" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-8 h-8" />
              <Skeleton className="w-8 h-8" />
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
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Drivers ({filteredAndPaginatedDrivers.totalItems})
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
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="mr-2 w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Filter */}
        <div className="flex sm:flex-row flex-col gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="top-1/2 left-3 absolute w-4 h-4 text-gray-400 -translate-y-1/2 transform" />
              <Input
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredAndPaginatedDrivers.data}
          columns={createDriverColumns()}
          loading={loading}
          getRowId={(row) => row.no}
          onSaveEdits={async (changes) => {
            for (const change of changes) {
              const no = (change.row as Driver).no;
              await updateDriver(no, change.updates as Partial<Driver>);
            }
            await handleRefresh();
          }}
        />

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
              {Math.min(currentPage * itemsPerPage, filteredAndPaginatedDrivers.totalItems)} of{' '}
              {filteredAndPaginatedDrivers.totalItems} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!filteredAndPaginatedDrivers.hasPrevPage}
              className="p-0 w-8 h-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, filteredAndPaginatedDrivers.totalPages) }, (_, i) => {
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
              disabled={!filteredAndPaginatedDrivers.hasNextPage}
              className="p-0 w-8 h-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
