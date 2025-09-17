'use client';

import React from 'react';
import { 
  Route, 
  GitBranch, 
  Building2, 
  Users, 
  Truck, 
  Navigation, 
  UserCheck, 
  LogOut,
  LayoutDashboard,
  Car,
  BarChart3
} from 'lucide-react';
import { useApp } from '@/contexts/app-context';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { BranchSelector } from './branch-selector';

const navigation = [
  {
    title: 'DASHBOARD',
    items: [
      { id: 'routing-dashboard', name: 'Routing Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'ROUTING INFORMATION',
    items: [
      { id: 'routes', name: 'Routes', icon: Route },
      { id: 'route-reports', name: 'Route Reports', icon: BarChart3 },
    ],
  },
  {
    title: 'BRANCH INFORMATION',
    items: [
      { id: 'branches', name: 'Branches', icon: Building2 },
      { id: 'customers', name: 'Customers', icon: Users },
      { id: 'drivers', name: 'Drivers', icon: Truck },
      { id: 'staff', name: 'Staff', icon: UserCheck },
      { id: 'vehicles', name: 'Vehicles', icon: Navigation },
      { id: 'editable-routes', name: 'Editable Routes', icon: GitBranch },
    ],
  },
  {
    title: 'EDITABLE INFORMATION',
    items: [
      { id: 'editable-info', name: 'Editable Info', icon: GitBranch },
    ],
  },
];

export function Sidebar() {
  const { activeTab, setActiveTab } = useApp();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
  };

  return (
    <div className="flex flex-col bg-white border-gray-200 border-r w-64 h-screen">
      {/* Branch Selector at the top */}
      <div className="p-4 border-gray-200 border-b">
        <BranchSelector />
      </div>
      
      <nav className="flex-1 space-y-6 px-4 py-6">
        {navigation.map((section) => (
          <div key={section.title}>
            <h3 className="mb-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">
              {section.title}
            </h3>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-md w-full font-medium text-sm text-left transition-colors',
                        isActive
                          ? 'bg-slate-800 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      
      <div className="p-4 border-gray-200 border-t">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 hover:bg-red-50 px-3 py-2 rounded-md w-full font-medium text-red-600 text-sm text-left transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}