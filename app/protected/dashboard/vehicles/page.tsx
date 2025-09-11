'use client';

import React from 'react';
import { StatsCard } from '@/components/common/stats-card';
import { VehiclesTable } from '@/components/vehicles/vehicles-table';
import { useVehicles } from '@/contexts/vehicles-context';
import { Truck, Wrench, MapPin, Calendar } from 'lucide-react';

export default function VehiclesPage() {
  const { vehicles } = useVehicles();

  // Calculate real stats from actual data
  const totalVehicles = vehicles.length;
  const withStructureName = vehicles.filter(vehicle => vehicle.structure_name).length;
  const withRegistrationNo = vehicles.filter(vehicle => vehicle.registration_no).length;
  const withFleetNo = vehicles.filter(vehicle => vehicle.fleet_no).length;

  const stats = [
    { 
      title: 'Total Vehicles', 
      value: totalVehicles.toString(), 
      color: 'blue' as const, 
      icon: <Truck className="w-5 h-5" /> 
    },
    { 
      title: 'With Structure Name', 
      value: withStructureName.toString(), 
      color: 'green' as const, 
      icon: <MapPin className="w-5 h-5" /> 
    },
    { 
      title: 'With Registration No', 
      value: withRegistrationNo.toString(), 
      color: 'orange' as const, 
      icon: <Wrench className="w-5 h-5" /> 
    },
    { 
      title: 'With Fleet No', 
      value: withFleetNo.toString(), 
      color: 'purple' as const, 
      icon: <Calendar className="w-5 h-5" /> 
    },
  ];

  return (
    <div className="flex flex-col space-y-6 h-full">
      <div className="flex-shrink-0">
        <h1 className="font-bold text-slate-800 text-3xl">VEHICLES</h1>
        <p className="mt-1 text-gray-600">
          Manage and monitor fleet vehicles and assignments
        </p>
      </div>

      <div className="flex-shrink-0 gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <VehiclesTable />
      </div>
    </div>
  );
}