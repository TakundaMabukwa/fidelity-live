'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GroupedRoute } from '@/lib/types';

interface GroupedRoutesContextType {
  groupedRoutes: GroupedRoute[];
  loading: boolean;
  error: string | null;
  loadGroupedRoutes: () => Promise<void>;
  refreshGroupedRoutes: () => Promise<void>;
  isLoaded: boolean;
  hasData: boolean;
}

const GroupedRoutesContext = createContext<GroupedRoutesContextType | undefined>(undefined);

interface GroupedRoutesProviderProps {
  children: ReactNode;
}

export function GroupedRoutesProvider({ children }: GroupedRoutesProviderProps) {
  const [groupedRoutes, setGroupedRoutes] = useState<GroupedRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadGroupedRoutes = async () => {
    if (loading) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading grouped routes...');
      
      const response = await fetch('/api/routes/grouped');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch grouped routes');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setGroupedRoutes(result.data);
        setIsLoaded(true);
        console.log('✅ Grouped routes loaded:', result.data.length);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load grouped routes';
      setError(errorMessage);
      console.error('❌ Error loading grouped routes:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshGroupedRoutes = async () => {
    setIsLoaded(false);
    await loadGroupedRoutes();
  };

  // Auto-load on mount
  useEffect(() => {
    if (!isLoaded && !loading) {
      loadGroupedRoutes();
    }
  }, [isLoaded, loading]);

  const hasData = groupedRoutes.length > 0;

  const value: GroupedRoutesContextType = {
    groupedRoutes,
    loading,
    error,
    loadGroupedRoutes,
    refreshGroupedRoutes,
    isLoaded,
    hasData,
  };

  return (
    <GroupedRoutesContext.Provider value={value}>
      {children}
    </GroupedRoutesContext.Provider>
  );
}

export function useGroupedRoutes() {
  const context = useContext(GroupedRoutesContext);
  if (context === undefined) {
    throw new Error('useGroupedRoutes must be used within a GroupedRoutesProvider');
  }
  return context;
}
