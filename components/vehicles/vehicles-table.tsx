'use client';

import React, { useState, useMemo } from 'react';
import { DataTable } from '@/components/common/data-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVehicles } from '@/contexts/vehicles-context';
import { Vehicle } from '@/lib/types';
import { TableColumn } from '@/lib/types';
import { RefreshCw, ChevronLeft, ChevronRight, Truck, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { updateVehicle } from '@/lib/actions/vehicles';

const createVehicleColumns = (): TableColumn<Vehicle>[] => [
  {
    key: 'id',
    header: 'ID',
    sortable: true,
  },
  {
    key: 'structure_name',
    header: 'Structure Name',
    render: (value: string | null) => (
      <span className="font-medium">
        {value || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'registration_no',
    header: 'Registration No',
    render: (value: string | null) => (
      <span className="font-mono text-sm">
        {value || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'fleet_no',
    header: 'Fleet No',
    render: (value: string | null) => (
      <span className="text-sm">
        {value || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
  {
    key: 'manufacturer',
    header: 'Manufacturer',
    render: (value: string | null) => (
      <span className="text-sm">
        {value || <span className="text-gray-400">-</span>}
      </span>
    ),
  },
];

export function VehiclesTable() {
  const { vehicles, loading, error, loadVehicles, refreshVehicles, isLoaded, hasData } = useVehicles();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Auto-load data on component mount
  React.useEffect(() => {
    if (!isLoaded && !loading) {
      loadVehicles();
    }
  }, [isLoaded, loading, loadVehicles]);

  // Memoized paginated data
  const paginatedVehicles = useMemo(() => {
    // Calculate pagination
    const totalItems = vehicles.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = vehicles.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      totalItems,
      totalPages,
      currentPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }, [vehicles, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleRefresh = () => {
    refreshVehicles();
  };

  const handleDownloadCSV = () => {
    // Create CSV content
    const headers = ['ID', 'Structure Name', 'Registration No', 'Fleet No', 'Manufacturer'];
    const csvContent = [
      headers.join(','),
      ...vehicles.map(vehicle => [
        vehicle.id,
        vehicle.structure_name || '',
        vehicle.registration_no || '',
        vehicle.fleet_no || '',
        vehicle.manufacturer || ''
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vehicles_${new Date().toISOString().split('T')[0]}.csv`);
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
              <Truck className="mx-auto mb-2 w-12 h-12" />
              <h3 className="font-semibold text-lg">Error Loading Vehicles</h3>
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
              <Truck className="w-5 h-5" />
              Vehicles
            </CardTitle>
            <div className="flex gap-2">
              <Skeleton className="w-20 h-8" />
              <Skeleton className="w-20 h-8" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
           {/* Table Skeleton */}
           <div className="space-y-3">
             {/* Table Header Skeleton */}
             <div className="gap-4 grid grid-cols-5 bg-gray-50 p-4 rounded-lg">
               {Array.from({ length: 5 }, (_, i) => (
                 <Skeleton key={i} className="w-full h-4" />
               ))}
             </div>
             
             {/* Table Rows Skeleton */}
             {Array.from({ length: 10 }, (_, rowIndex) => (
               <div key={rowIndex} className="gap-4 grid grid-cols-5 p-4 border-b">
                 {Array.from({ length: 5 }, (_, colIndex) => (
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
              <Truck className="w-5 h-5" />
              Vehicles ({paginatedVehicles.totalItems})
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
        {/* Data Table */}
        <DataTable
          data={paginatedVehicles.data}
          columns={createVehicleColumns()}
          loading={loading}
          getRowId={(row) => row.id}
          onSaveEdits={async (changes) => {
            for (const change of changes) {
              const id = (change.row as Vehicle).id;
              await updateVehicle(id, change.updates as Partial<Vehicle>);
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
              {Math.min(currentPage * itemsPerPage, paginatedVehicles.totalItems)} of{' '}
              {paginatedVehicles.totalItems} entries
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!paginatedVehicles.hasPrevPage}
              className="p-0 w-8 h-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            {Array.from({ length: Math.min(5, paginatedVehicles.totalPages) }, (_, i) => {
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
              disabled={!paginatedVehicles.hasNextPage}
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
