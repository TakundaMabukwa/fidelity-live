'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/common/data-table';
import { getRouteTimingLogs, RouteTimingData } from '@/lib/actions/route-timing';
import { TableColumn } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';

// Define columns for the route timing logs table
const routeTimingColumns: TableColumn<RouteTimingData>[] = [
  {
    key: 'route_name',
    header: 'Route Name',
    sortable: true,
    render: (routeName: string) => (
      <span className="font-medium text-blue-600">{routeName}</span>
    )
  },
  {
    key: 'estimated_total_time_minutes',
    header: 'Estimated Time',
    sortable: true,
    render: (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      const timeString = hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
      
      return (
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-blue-500" />
          <span className="font-medium">{timeString}</span>
        </div>
      );
    }
  },
  {
    key: 'actual_total_time_minutes',
    header: 'Actual Time',
    sortable: true,
    render: (minutes: number | null) => (
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4 text-green-500" />
        <span className="font-medium">
          {minutes ? `${minutes} min` : 'N/A'}
        </span>
      </div>
    )
  },
  {
    key: 'time_difference_minutes',
    header: 'Time Difference',
    sortable: true,
    render: (difference: number | null) => {
      if (difference === null) return <span className="text-gray-400">N/A</span>;
      
      const isOverTime = difference > 0;
      return (
        <div className={`flex items-center gap-1 ${isOverTime ? 'text-red-600' : 'text-green-600'}`}>
          <TrendingUp className={`w-4 h-4 ${isOverTime ? 'rotate-180' : ''}`} />
          <span className="font-medium">
            {isOverTime ? '+' : ''}{difference} min
          </span>
        </div>
      );
    }
  },
  {
    key: 'total_stops',
    header: 'Total Stops',
    sortable: true,
    render: (total: number) => (
      <span className="font-medium">{total}</span>
    )
  },
  {
    key: 'completed_stops',
    header: 'Completed',
    sortable: true,
    render: (completed: number, row: RouteTimingData) => {
      const total = row.total_stops || 0;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="font-medium">{completed}/{total}</span>
          </div>
          <span className="text-gray-500 text-xs">({percentage}%)</span>
        </div>
      );
    }
  },
];

export default function RouteReportsPage() {
  const [routeTimingLogs, setRouteTimingLogs] = useState<RouteTimingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRouteTimingLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const logs = await getRouteTimingLogs(100, 0);
      setRouteTimingLogs(logs);
    } catch (err) {
      console.error('Error loading route timing logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load route timing logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRouteTimingLogs();
  }, []);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-bold text-slate-800 text-3xl">ROUTE REPORTS</h1>
          <p className="mt-1 text-gray-600">
            Performance analysis and timing reports for all routes
          </p>
        </div>
        <Button
          onClick={loadRouteTimingLogs}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>


      {/* Error State */}
      {error && (
        <div className="bg-red-50 p-4 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            <div>
              <p className="font-medium">Error Loading Data</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Route Timing Logs Table */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900 text-lg">Route Timing Logs</h2>
          <p className="text-gray-600 text-sm">
            Detailed performance data for all routes with timing analysis
          </p>
        </div>
        
        <DataTable
          data={routeTimingLogs}
          columns={routeTimingColumns}
          loading={loading}
          searchable={true}
          showActions={false}
          searchPlaceholder="Search routes, vehicles..."
        />
      </div>
    </div>
  );
}
