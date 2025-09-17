'use client';

import React, { useState, useMemo } from 'react';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomers } from '@/contexts/customers-context';
import { Customer } from '@/lib/types';
import { TableColumn } from '@/lib/types';
import { RefreshCw, ChevronLeft, ChevronRight, Users, FileText, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { updateCustomerDuration } from '@/lib/actions/customers';

const createCustomerColumns = (): TableColumn<Customer>[] => [
  {
    key: 'type',
    header: 'Type',
    render: (value: unknown) => (
      <span className="text-sm">
        {(value as string) || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'code',
    header: 'Code',
    render: (value: unknown) => (
      <span className="font-mono text-sm">
        {(value as string) || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'customer',
    header: 'Customer',
    render: (value: unknown) => (
      <span className="font-medium">
        {(value as string) || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'duration_in_sec',
    header: 'Duration (Sec)',
    render: (value: unknown) => (
      <span className="font-mono text-sm">
        {(value as string) || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'duration',
    header: 'Duration',
    render: (value: unknown) => (
      <span className="font-mono text-sm">
        {(value as string) || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'collection_bags',
    header: 'Collection Bags',
    render: (value: unknown) => (
      <span className="text-sm">
        {(value as string) || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'delivery_bags',
    header: 'Delivery Bags',
    render: (value: unknown) => (
      <span className="text-sm">
        {(value as string) || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
];

export function CustomersTable() {
  const { customers, loading, error, loadCustomers, refreshCustomers, isLoaded, hasData } = useCustomers();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');

  // Auto-load data on component mount
  React.useEffect(() => {
    if (!isLoaded && !loading) {
      loadCustomers();
    }
  }, [isLoaded, loading, loadCustomers]);

  // Memoized filtered and paginated data
  const filteredAndPaginatedCustomers = useMemo(() => {
    let filtered = customers;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.customer?.toLowerCase().includes(searchLower) ||
        customer.code?.toLowerCase().includes(searchLower) ||
        customer.type?.toLowerCase().includes(searchLower) ||
        customer.status?.toLowerCase().includes(searchLower)
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
  }, [customers, searchTerm, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleRefresh = () => {
    refreshCustomers();
  };

  const handleDownloadCSV = () => {
    // Create CSV content
    const headers = [
      'Type', 'Code', 'Customer', 'Duration In Sec', 
      'Duration', 'Collection Bags', 'Delivery Bags'
    ];
    const csvContent = [
      headers.join(','),
      ...customers.map(customer => [
        customer.type || '',
        customer.code || '',
        `"${(customer.customer || '').replace(/"/g, '""')}"`,
        customer.duration_in_sec || '',
        customer.duration || '',
        customer.collection_bags || '',
        customer.delivery_bags || ''
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <Users className="mx-auto mb-2 w-12 h-12" />
              <h3 className="font-semibold text-lg">Error Loading Customers</h3>
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
              <Users className="w-5 h-5" />
              Customers
            </CardTitle>
            <div className="flex gap-2">
              <Skeleton className="w-20 h-8" />
              <Skeleton className="w-20 h-8" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search Filter Skeleton */}
          <div className="flex-1">
            <Skeleton className="w-full h-10" />
          </div>
          
          {/* Table Skeleton */}
          <div className="space-y-3">
            {/* Table Header Skeleton */}
            <div className="gap-4 grid grid-cols-9 bg-gray-50 p-4 rounded-lg">
              {Array.from({ length: 9 }, (_, i) => (
                <Skeleton key={i} className="w-full h-4" />
              ))}
            </div>
            
            {/* Table Rows Skeleton */}
            {Array.from({ length: 10 }, (_, rowIndex) => (
              <div key={rowIndex} className="gap-4 grid grid-cols-9 p-4 border-b">
                {Array.from({ length: 9 }, (_, colIndex) => (
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
              <Users className="w-5 h-5" />
              Customers ({filteredAndPaginatedCustomers.totalItems})
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
            <Button onClick={handleDownloadCSV} variant="outline" size="sm">
              <FileText className="mr-2 w-4 h-4" />
              Download CSV
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
                placeholder="Search customers..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={filteredAndPaginatedCustomers.data}
          columns={createCustomerColumns()}
          loading={loading}
          getRowId={(row) => row.id}
          onSaveEdits={async (changes) => {
            // Persist changes for each edited row
            for (const change of changes) {
              const id = (change.row as Customer).id;
              await updateCustomerDuration(id, change.updates as Partial<Customer>);
            }
            await handleRefresh();
          }}
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
              {Math.min(currentPage * itemsPerPage, filteredAndPaginatedCustomers.totalItems)} of{' '}
              {filteredAndPaginatedCustomers.totalItems} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!filteredAndPaginatedCustomers.hasPrevPage}
              className="p-0 w-8 h-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, filteredAndPaginatedCustomers.totalPages) }, (_, i) => {
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
              disabled={!filteredAndPaginatedCustomers.hasNextPage}
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

