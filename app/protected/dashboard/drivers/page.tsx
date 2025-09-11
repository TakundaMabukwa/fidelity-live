'use client';

import React from 'react';
import { StatsCard } from '@/components/common/stats-card';
import { DriversTable } from '@/components/drivers/drivers-table';
import { useDrivers } from '@/contexts/drivers-context';
import { Truck, UserCheck, Clock, MapPin } from 'lucide-react';

export default function DriversPage() {
  const { drivers } = useDrivers();

  // Calculate real stats from actual data
  const totalDrivers = drivers.length;
  const withCompanyNo = drivers.filter(driver => driver.comp_no).length;
  const withFullNames = drivers.filter(driver => driver.full_names).length;
  const withCellPhone = drivers.filter(driver => driver.cell).length;

  const stats = [
    { 
      title: 'Total Drivers', 
      value: totalDrivers.toString(), 
      color: 'blue' as const, 
      icon: <Truck className="w-5 h-5" /> 
    },
    { 
      title: 'With Company No', 
      value: withCompanyNo.toString(), 
      color: 'green' as const, 
      icon: <UserCheck className="w-5 h-5" /> 
    },
    { 
      title: 'With Full Names', 
      value: withFullNames.toString(), 
      color: 'orange' as const, 
      icon: <Clock className="w-5 h-5" /> 
    },
    { 
      title: 'With Cell Phone', 
      value: withCellPhone.toString(), 
      color: 'purple' as const, 
      icon: <MapPin className="w-5 h-5" /> 
    },
  ];

  return (
    <div className="flex flex-col space-y-6 h-full">
      <div className="flex-shrink-0">
        <h1 className="font-bold text-slate-800 text-3xl">DRIVERS</h1>
        <p className="mt-1 text-gray-600">
          Manage and monitor driver information and assignments
        </p>
      </div>

      <div className="flex-shrink-0 gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <DriversTable />
      </div>
    </div>
  );
}