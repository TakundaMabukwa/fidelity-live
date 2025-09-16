'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MoreHorizontal, Download, Columns } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableColumn } from '@/lib/types';

interface DataTableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  title?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  searchable?: boolean;
  showActions?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchPlaceholder = "Search...",
  loading = false,
  searchable = true,
  showActions = true
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  const handleSort = (key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="bg-gray-200 rounded w-32 h-8 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="bg-gray-200 rounded w-24 h-10 animate-pulse"></div>
            <div className="bg-gray-200 rounded w-24 h-10 animate-pulse"></div>
          </div>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="bg-gray-100 border-b h-12"></div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="border-b last:border-b-0 h-16">
                <div className="flex items-center gap-4 px-4 h-full">
                  {columns.map((_, j) => (
                    <div key={j} className="flex-1 bg-gray-200 rounded h-4 animate-pulse"></div>
                  ))}
                  <div className="bg-gray-200 rounded w-16 h-4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      {/* Header */}
      <div className="flex flex-shrink-0 justify-between items-center">
        {title && <h2 className="font-bold text-gray-900 text-2xl">{title}</h2>}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 w-4 h-4" />
            Download (csv)
          </Button>
          <Button variant="outline" size="sm">
            <Columns className="mr-2 w-4 h-4" />
            Columns
          </Button>
        </div>
      </div>

      {/* Search */}
      {searchable && (
        <div className="flex flex-shrink-0 justify-between items-center">
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <div className="text-gray-600 text-sm">
            Showing {sortedData.length} of {data.length} entries
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex flex-col flex-1 border rounded-lg min-h-0 overflow-hidden">
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <table className="w-full table-fixed">
          <thead className="top-0 z-10 sticky bg-slate-800 text-white">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key as string}
                  className={`px-4 py-3 font-medium text-left ${
                    index === 0 ? 'w-16' : // NO column
                    index === 1 ? 'w-24' : // COMP NO column
                    index === 2 ? 'w-32' : // SURNAME column
                    index === 3 ? 'w-20' : // INITIAL column
                    index === 4 ? 'w-40' : // FULL NAMES column
                    index === 5 ? 'w-36' : // ID NUMBER column
                    index === 6 ? 'w-32' : // CELL # column
                    'w-48' // JOB DESCRIPTION column
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      column.sortable !== false ? 'cursor-pointer hover:text-blue-200' : ''
                    }`}
                    onClick={() => column.sortable !== false && handleSort(column.key)}
                  >
                    {column.header}
                    {column.sortable !== false && (
                      <div className="flex flex-col">
                        <ChevronUp
                          className={`h-3 w-3 ${
                            sortConfig?.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-blue-200'
                              : 'text-gray-400'
                          }`}
                        />
                        <ChevronDown
                          className={`h-3 w-3 -mt-1 ${
                            sortConfig?.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-blue-200'
                              : 'text-gray-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {showActions && (
                <th className="px-4 py-3 w-20 font-medium text-left">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 border-b">
                {columns.map((column, colIndex) => (
                  <td 
                    key={column.key as string} 
                    className={`px-4 py-3 truncate ${
                      colIndex === 0 ? 'w-16' : // NO column
                      colIndex === 1 ? 'w-24' : // COMP NO column
                      colIndex === 2 ? 'w-32' : // SURNAME column
                      colIndex === 3 ? 'w-20' : // INITIAL column
                      colIndex === 4 ? 'w-40' : // FULL NAMES column
                      colIndex === 5 ? 'w-36' : // ID NUMBER column
                      colIndex === 6 ? 'w-32' : // CELL # column
                      'w-48' // JOB DESCRIPTION column
                    }`}
                    title={column.render ? String(column.render(row[column.key], row)) : String(row[column.key])}
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]
                    }
                  </td>
                ))}
                {showActions && (
                  <td className="px-4 py-3 w-20">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}