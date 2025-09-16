'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ExternalVehicle } from '@/lib/types';

interface ExternalVehiclesContextType {
  vehicles: ExternalVehicle[];
  loading: boolean;
  error: string | null;
  loadVehicles: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  isLoaded: boolean;
  hasData: boolean;
  isMockData: boolean;
  isDatabaseData: boolean;
  externalError: string | null;
}

const ExternalVehiclesContext = createContext<ExternalVehiclesContextType | undefined>(undefined);

interface ExternalVehiclesProviderProps {
  children: ReactNode;
}

export function ExternalVehiclesProvider({ children }: ExternalVehiclesProviderProps) {
  const [vehicles, setVehicles] = useState<ExternalVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMockData, setIsMockData] = useState(false);
  const [isDatabaseData, setIsDatabaseData] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);

  const loadVehicles = async () => {
    if (loading) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading external vehicles...');
      
      const response = await fetch('/api/fidelity/vehicles');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch vehicles');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setVehicles(result.data);
        setIsLoaded(true);
        setIsMockData(result.isMockData || false);
        setIsDatabaseData(result.isDatabaseData || false);
        setExternalError(result.externalError || null);
        const dataSource = result.isMockData ? 'mock data' : result.isDatabaseData ? 'database data' : 'external API';
        console.log('✅ External vehicles loaded:', result.data.length, `(${dataSource})`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load external vehicles';
      setError(errorMessage);
      console.error('❌ Error loading external vehicles:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshVehicles = async () => {
    setIsLoaded(false);
    await loadVehicles();
  };

  // Auto-load on mount
  useEffect(() => {
    if (!isLoaded && !loading) {
      loadVehicles();
    }
  }, [isLoaded, loading]);

  const hasData = vehicles.length > 0;

  const value: ExternalVehiclesContextType = {
    vehicles,
    loading,
    error,
    loadVehicles,
    refreshVehicles,
    isLoaded,
    hasData,
    isMockData,
    isDatabaseData,
    externalError,
  };

  return (
    <ExternalVehiclesContext.Provider value={value}>
      {children}
    </ExternalVehiclesContext.Provider>
  );
}

export function useExternalVehicles() {
  const context = useContext(ExternalVehiclesContext);
  if (context === undefined) {
    throw new Error('useExternalVehicles must be used within an ExternalVehiclesProvider');
  }
  return context;
}
