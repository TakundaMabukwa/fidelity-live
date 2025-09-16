'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Vehicle } from '@/lib/types';
import { getVehicles } from '@/lib/actions/vehicles';

interface VehiclesContextType {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  isLoaded: boolean;
  loadVehicles: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  hasData: boolean;
}

const VehiclesContext = createContext<VehiclesContextType | undefined>(undefined);

export function VehiclesProvider({ children }: { children: React.ReactNode }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadVehicles = useCallback(async () => {
    // If data is already loaded, don't reload unless explicitly requested
    if (isLoaded && vehicles.length > 0) {
      console.log('Vehicles data already cached, using existing data');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getVehicles();
      if (result.success && result.data) {
        setVehicles(result.data);
        setIsLoaded(true);
        console.log('Vehicles data loaded and cached:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to load vehicles');
      }
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, vehicles.length]);

  const refreshVehicles = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getVehicles();
      if (result.success && result.data) {
        setVehicles(result.data);
        setIsLoaded(true);
        console.log('Vehicles data refreshed and cached:', result.data.length);
      } else {
        throw new Error(result.error || 'Failed to refresh vehicles');
      }
    } catch (err) {
      console.error('Error refreshing vehicles:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh vehicles');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <VehiclesContext.Provider
      value={{
        vehicles,
        loading,
        error,
        isLoaded,
        loadVehicles,
        refreshVehicles,
        hasData: vehicles.length > 0,
      }}
    >
      {children}
    </VehiclesContext.Provider>
  );
}

export function useVehicles() {
  const context = useContext(VehiclesContext);
  if (context === undefined) {
    throw new Error('useVehicles must be used within a VehiclesProvider');
  }
  return context;
}