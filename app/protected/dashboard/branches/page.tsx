'use client';

import React, { useEffect } from 'react';
import { DataTable } from '@/components/common/data-table';
import { StatsCard } from '@/components/common/stats-card';
import { useBranches } from '@/contexts/branches-context';
import { TableColumn } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const branchColumns: TableColumn[] = [
  { key: 'branch', header: 'Branch' },
  { key: 'branchCode', header: 'Branch Code' },
  { key: 'footprint', header: 'Footprint' },
  { key: 'physicalAddress', header: 'Physical Address' },
  { key: 'gpsCoordinates', header: 'GPS Co-ordinates' },
];

export default function BranchesPage() {
  const { branches, loading, loadBranches } = useBranches();

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const stats = [
    { title: 'Total Branches', value: '1', subtitle: '1 visible', color: 'purple' as const },
    { title: 'Active Branches', value: '1', subtitle: 'Currently operational', color: 'green' as const },
    { title: 'Countries', value: '1', subtitle: 'Geographic coverage', color: 'blue' as const },
    { title: 'Last Updated', value: '9/1/2025', subtitle: 'Most recent change', color: 'orange' as const },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">BRANCHES</h1>
        <p className="text-gray-600 mt-1">
          Manage and monitor branch locations and information
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-green-700">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
          <div>
            <p className="font-medium">Branch Data Available from Database</p>
            <p className="text-sm">1 branches loaded from Supabase</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <DataTable
        data={branches}
        columns={branchColumns}
        title="All Branches"
        searchPlaceholder="Filter branches..."
        loading={loading}
      />
    </div>
  );
}