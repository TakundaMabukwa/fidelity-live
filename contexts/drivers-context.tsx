'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Driver } from '@/lib/types';
import { getDrivers } from '@/lib/actions/drivers';

interface DriversContextType {
  drivers: Driver[];
  loading: boolean;
  error: string | null;
  isLoaded: boolean;
  loadDrivers: () => Promise<void>;
  refreshDrivers: () => Promise<void>;
  hasData: boolean;
}

const DriversContext = createContext<DriversContextType | undefined>(undefined);

export function DriversProvider({ children }: { children: React.ReactNode }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadDrivers = useCallback(async () => {
    // If data is already loaded, don't reload unless explicitly requested
    if (isLoaded && drivers.length > 0) {
      console.log('Drivers data already cached, using existing data');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getDrivers();
      setDrivers(data);
      setIsLoaded(true);
      console.log('Drivers data loaded and cached');
    } catch (err) {
      console.error('Error loading drivers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, drivers.length]);

  const refreshDrivers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getDrivers();
      setDrivers(data);
      setIsLoaded(true);
      console.log('Drivers data refreshed and cached');
    } catch (err) {
      console.error('Error refreshing drivers:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh drivers');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <DriversContext.Provider
      value={{
        drivers,
        loading,
        error,
        isLoaded,
        loadDrivers,
        refreshDrivers,
        hasData: drivers.length > 0,
      }}
    >
      {children}
    </DriversContext.Provider>
  );
}

export function useDrivers() {
  const context = useContext(DriversContext);
  if (context === undefined) {
    throw new Error('useDrivers must be used within a DriversProvider');
  }
  return context;
}