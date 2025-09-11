'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RouteAssignment } from '@/lib/types';

interface RouteAssignmentContextType {
  routeAssignments: RouteAssignment[];
  loading: boolean;
  loadRouteAssignments: () => void;
  isLoaded: boolean;
}

const RouteAssignmentContext = createContext<RouteAssignmentContextType | undefined>(undefined);

export function RouteAssignmentProvider({ children }: { children: ReactNode }) {
  const [routeAssignments, setRouteAssignments] = useState<RouteAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadRouteAssignments = async () => {
    if (isLoaded) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const mockRouteAssignments: RouteAssignment[] = [
      {
        id: '1',
        route: '845DA2',
        locationCode: '8459201',
        serviceDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        userGroup: '845',
        created: '9/2/2025'
      },
      {
        id: '2',
        route: '846DA3',
        locationCode: '8459202',
        serviceDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        userGroup: '846',
        created: '9/1/2025'
      }
    ];
    
    setRouteAssignments(mockRouteAssignments);
    setLoading(false);
    setIsLoaded(true);
  };

  return (
    <RouteAssignmentContext.Provider value={{ routeAssignments, loading, loadRouteAssignments, isLoaded }}>
      {children}
    </RouteAssignmentContext.Provider>
  );
}

export function useRouteAssignment() {
  const context = useContext(RouteAssignmentContext);
  if (context === undefined) {
    throw new Error('useRouteAssignment must be used within a RouteAssignmentProvider');
  }
  return context;
}