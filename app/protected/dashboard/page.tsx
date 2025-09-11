'use client';

import React from 'react';
import { useApp } from '@/contexts/app-context';
import RoutesPage from './routes/page';
import BranchesPage from './branches/page';
import CustomersPage from './customers/page';
import DriversPage from './drivers/page';
import StaffPage from './staff/page';
import RouteAssignmentPage from './route-assignment/page';
import VehiclesPage from './vehicles/page';
import RoutingDashboardPage from '../routing-dashboard/page';

export default function DashboardPage() {
  const { activeTab } = useApp();

  const renderContent = () => {
    switch (activeTab) {
      case 'routing-dashboard':
        return <RoutingDashboardPage />;
      case 'routes':
        return <RoutesPage />;
      case 'route-assignment':
        return <RouteAssignmentPage />;
      case 'branches':
        return <BranchesPage />;
      case 'customers':
        return <CustomersPage />;
      case 'drivers':
        return <DriversPage />;
      case 'staff':
        return <StaffPage />;
      case 'vehicles':
        return <VehiclesPage />;
      default:
        return <RoutingDashboardPage />;
    }
  };

  return renderContent();
}