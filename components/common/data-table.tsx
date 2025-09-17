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
  getRowId?: (row: T) => string | number;
  onSaveEdits?: (changes: Array<{ row: T; rowIndex: number; updates: Partial<T> }>) => Promise<void> | void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchPlaceholder = "Search...",
  loading = false,
  searchable = true,
  showActions = true,
  getRowId,
  onSaveEdits
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [rowEditing, setRowEditing] = useState<Set<number>>(new Set());
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
    if (isEditing || rowEditing.size > 0) return; // Disable sorting while editing
    setSortConfig(prev => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getCellMapKey = (rowIndex: number, key: keyof T) => `${rowIndex}:${String(key)}`;
  const getEditedValue = (row: T, rowIndex: number, key: keyof T) => {
    const mapKey = getCellMapKey(rowIndex, key);
    return Object.prototype.hasOwnProperty.call(editedValues, mapKey)
      ? editedValues[mapKey]
      : row[key];
  };
  const setEditedValue = (rowIndex: number, key: keyof T, value: any) => {
    const mapKey = getCellMapKey(rowIndex, key);
    setEditedValues(prev => ({ ...prev, [mapKey]: value }));
  };

  const normalizeForEdit = (value: any): any => {
    if (typeof value === 'string') return value.trim();
    return value;
  };

  const initializeRowEditedValues = (row: T, rowIndex: number) => {
    const updates: Record<string, any> = {};
    for (const col of columns) {
      const original = row[col.key];
      const normalized = normalizeForEdit(original);
      if (normalized !== original) {
        updates[getCellMapKey(rowIndex, col.key)] = normalized;
      }
    }
    if (Object.keys(updates).length > 0) {
      setEditedValues(prev => ({ ...prev, ...updates }));
    }
  };

  const handleCancel = () => {
    setEditedValues({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!onSaveEdits) {
      setIsEditing(false);
      setEditedValues({});
      return;
    }
    // Group edited values by row index and construct updates objects
    const updatesByRowIndex: Record<number, Partial<T>> = {} as Record<number, Partial<T>>;
    for (const key of Object.keys(editedValues)) {
      const [rowIndexStr, colKey] = key.split(':');
      const rowIndex = Number(rowIndexStr);
      if (Number.isNaN(rowIndex)) continue;
      const originalRow = sortedData[rowIndex];
      if (!originalRow) continue;
      const newValue = editedValues[key];
      const originalValue = (originalRow as any)[colKey];
      if (newValue === originalValue) continue;
      if (!updatesByRowIndex[rowIndex]) updatesByRowIndex[rowIndex] = {} as Partial<T>;
      (updatesByRowIndex[rowIndex] as any)[colKey] = newValue;
    }

    const changes: Array<{ row: T; rowIndex: number; updates: Partial<T> }> = Object.entries(updatesByRowIndex)
      .map(([rowIndexStr, updates]) => {
        const rowIndex = Number(rowIndexStr);
        return { row: sortedData[rowIndex], rowIndex, updates };
      });

    if (changes.length === 0) {
      setIsEditing(false);
      setEditedValues({});
      return;
    }

    await Promise.resolve(onSaveEdits(changes));
    setIsEditing(false);
    setEditedValues({});
  };

  const startRowEdit = (rowIndex: number) => {
    setRowEditing(prev => {
      const next = new Set(prev);
      next.add(rowIndex);
      return next;
    });
    const row = sortedData[rowIndex];
    if (row) initializeRowEditedValues(row, rowIndex);
  };

  const clearRowEditedValues = (rowIndex: number) => {
    setEditedValues(prev => {
      const next: Record<string, any> = {};
      const prefix = `${rowIndex}:`;
      for (const [k, v] of Object.entries(prev)) {
        if (!k.startsWith(prefix)) next[k] = v;
      }
      return next;
    });
  };

  const cancelRowEdit = (rowIndex: number) => {
    clearRowEditedValues(rowIndex);
    setRowEditing(prev => {
      const next = new Set(prev);
      next.delete(rowIndex);
      return next;
    });
  };

  const saveRowEdit = async (rowIndex: number) => {
    if (!onSaveEdits) {
      cancelRowEdit(rowIndex);
      return;
    }
    const updates: Partial<T> = {} as Partial<T>;
    const prefix = `${rowIndex}:`;
    const originalRow = sortedData[rowIndex];
    if (!originalRow) {
      cancelRowEdit(rowIndex);
      return;
    }
    for (const [k, v] of Object.entries(editedValues)) {
      if (!k.startsWith(prefix)) continue;
      const colKey = k.slice(prefix.length);
      const originalValue = (originalRow as any)[colKey];
      if (v === originalValue) continue;
      (updates as any)[colKey] = v;
    }
    if (Object.keys(updates).length === 0) {
      cancelRowEdit(rowIndex);
      return;
    }
    await Promise.resolve(onSaveEdits([{ row: originalRow, rowIndex, updates }]));
    clearRowEditedValues(rowIndex);
    setRowEditing(prev => {
      const next = new Set(prev);
      next.delete(rowIndex);
      return next;
    });
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
          {isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
              <Button variant="default" size="sm" onClick={handleSave}>Save</Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // initialize all visible rows with trimmed values
                sortedData.forEach((row, idx) => initializeRowEditedValues(row, idx));
                setIsEditing(true);
              }}
            >
              Edit
            </Button>
          )}
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
            disabled={isEditing || rowEditing.size > 0}
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
          <table className="w-full min-w-[1200px] table-auto">
          <thead className="top-0 z-10 sticky bg-slate-800 text-white">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key as string}
                  className={`px-4 py-3 font-medium text-left ${
                    index === 0 ? 'w-24' : // NO column
                    index === 1 ? 'w-32' : // COMP NO column
                    index === 2 ? 'w-48' : // SURNAME column
                    index === 3 ? 'w-32' : // INITIAL column
                    index === 4 ? 'w-64' : // FULL NAMES column
                    index === 5 ? 'w-56' : // ID NUMBER column
                    index === 6 ? 'w-48' : // CELL # column
                    'w-72' // JOB DESCRIPTION column
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      column.sortable !== false && !isEditing ? 'cursor-pointer hover:text-blue-200' : ''
                    }`}
                    onClick={() => column.sortable !== false && !isEditing && handleSort(column.key)}
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
                {columns.map((column, colIndex) => {
                  const rawValue = getEditedValue(row, index, column.key);
                  const valueType = typeof rawValue;
                  const isRowEditing = isEditing || rowEditing.has(index);
                  return (
                    <td 
                      key={column.key as string} 
                      className={`px-4 py-3 truncate ${
                        colIndex === 0 ? 'w-24' : // NO column
                        colIndex === 1 ? 'w-32' : // COMP NO column
                        colIndex === 2 ? 'w-48' : // SURNAME column
                        colIndex === 3 ? 'w-32' : // INITIAL column
                        colIndex === 4 ? 'w-64' : // FULL NAMES column
                        colIndex === 5 ? 'w-56' : // ID NUMBER column
                        colIndex === 6 ? 'w-48' : // CELL # column
                        'w-72' // JOB DESCRIPTION column
                      }`}
                    >
                      {isRowEditing ? (
                        valueType === 'boolean' ? (
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={Boolean(rawValue)}
                            onChange={(e) => setEditedValue(index, column.key, e.target.checked)}
                          />
                        ) : (
                          (() => {
                            const displayValue = rawValue == null ? '' : String(rawValue);
                            const widthCh = Math.min(60, Math.max(8, displayValue.length + 2));
                            return (
                              <Input
                                type={valueType === 'number' ? 'number' : 'text'}
                                value={displayValue}
                                onChange={(e) => setEditedValue(index, column.key, valueType === 'number' ? Number(e.target.value) : e.target.value)}
                                className="h-8 w-auto px-3 py-1"
                                style={{ width: `${widthCh}ch` }}
                              />
                            );
                          })()
                        )
                      ) : (
                        <span className="inline-block px-2 py-0.5">
                          {column.render
                            ? column.render(row[column.key], row)
                            : (row[column.key] as React.ReactNode)}
                        </span>
                      )}
                    </td>
                  );
                })}
                {showActions && (
                  <td className="px-4 py-3 w-20">
                    {rowEditing.has(index) ? (
                      <div className="flex items-center gap-2">
                        <Button variant="default" size="sm" onClick={() => saveRowEdit(index)}>Save</Button>
                        <Button variant="outline" size="sm" onClick={() => cancelRowEdit(index)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => startRowEdit(index)}>
                        Edit
                      </Button>
                    )}
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