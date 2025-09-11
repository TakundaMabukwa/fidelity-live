'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Route } from '@/lib/types';
import { getRoutes } from '@/lib/actions/routes';

interface RoutesContextType {
  routes: Route[];
  loading: boolean;
  error: string | null;
  loadRoutes: () => Promise<void>;
  refreshRoutes: () => Promise<void>;
  isLoaded: boolean;
  hasData: boolean;
}

const RoutesContext = createContext<RoutesContextType | undefined>(undefined);

export function RoutesProvider({ children }: { children: ReactNode }) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadRoutes = async () => {
    // If data is already loaded, don't reload unless explicitly requested
    if (isLoaded && routes.length > 0) {
      console.log('Routes data already cached, using existing data');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const routesData = await getRoutes();
      setRoutes(routesData);
      setIsLoaded(true);
      console.log('Routes data loaded and cached');
    } catch (err) {
      console.error('Error loading routes:', err);
      setError(err instanceof Error ? err.message : 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  const refreshRoutes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const routesData = await getRoutes();
      setRoutes(routesData);
      setIsLoaded(true);
      console.log('Routes data refreshed and cached');
    } catch (err) {
      console.error('Error refreshing routes:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh routes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoutesContext.Provider value={{ 
      routes, 
      loading, 
      error, 
      loadRoutes, 
      refreshRoutes, 
      isLoaded, 
      hasData: routes.length > 0 
    }}>
      {children}
    </RoutesContext.Provider>
  );
}

export function useRoutes() {
  const context = useContext(RoutesContext);
  if (context === undefined) {
    throw new Error('useRoutes must be used within a RoutesProvider');
  }
  return context;
}