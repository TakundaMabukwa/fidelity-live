'use client';

import React from 'react';
import { StatsCard } from '@/components/common/stats-card';
import { CustomersTable } from '@/components/customers/customers-table';
import { useCustomers } from '@/contexts/customers-context';
import { Users, UserCheck, Clock, Package } from 'lucide-react';

export default function CustomersPage() {
  const { customers } = useCustomers();

  // Calculate real stats from actual data
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(customer => customer.status === 'Active').length;
  const withDuration = customers.filter(customer => customer.duration).length;
  const withBags = customers.filter(customer => customer.collection_bags || customer.delivery_bags).length;

  const stats = [
    { 
      title: 'Total Customers', 
      value: totalCustomers.toString(), 
      color: 'blue' as const, 
      icon: <Users className="w-5 h-5" /> 
    },
    { 
      title: 'Active Customers', 
      value: activeCustomers.toString(), 
      color: 'green' as const, 
      icon: <UserCheck className="w-5 h-5" /> 
    },
    { 
      title: 'With Duration', 
      value: withDuration.toString(), 
      color: 'orange' as const, 
      icon: <Clock className="w-5 h-5" /> 
    },
    { 
      title: 'With Bags', 
      value: withBags.toString(), 
      color: 'purple' as const, 
      icon: <Package className="w-5 h-5" /> 
    },
  ];

  return (
    <div className="flex flex-col space-y-6 h-full">
      <div className="flex-shrink-0">
        <h1 className="font-bold text-slate-800 text-3xl">CUSTOMERS</h1>
        <p className="mt-1 text-gray-600">
          Manage and monitor customer duration and delivery information
        </p>
      </div>

      <div className="flex-shrink-0 gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <CustomersTable />
      </div>
    </div>
  );
}