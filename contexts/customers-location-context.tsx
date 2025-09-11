'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCustomersLocation, getCustomerLocationsByCodes, CustomerLocation } from '@/lib/actions/customers-location';

interface CustomersLocationContextType {
  locations: CustomerLocation[];
  loading: boolean;
  error: string | null;
  isLoaded: boolean;
  hasData: boolean;
  loadLocations: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  getLocationsByCodes: (codes: string[]) => Promise<CustomerLocation[]>;
}

const CustomersLocationContext = createContext<CustomersLocationContextType | undefined>(undefined);

export function CustomersLocationProvider({ children }: { children: ReactNode }) {
  const [locations, setLocations] = useState<CustomerLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setLoaded] = useState(false);

  const loadLocations = async () => {
    if (isLoaded) return; // Don't reload if already loaded
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading customers location data...');
      const data = await getCustomersLocation();
      setLocations(data);
      setLoaded(true);
      console.log(`Loaded ${data.length} customer locations`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customer locations';
      console.error('Error loading customer locations:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshLocations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Refreshing customers location data...');
      const data = await getCustomersLocation();
      setLocations(data);
      setLoaded(true);
      console.log(`Refreshed ${data.length} customer locations`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh customer locations';
      console.error('Error refreshing customer locations:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getLocationsByCodes = async (codes: string[]): Promise<CustomerLocation[]> => {
    try {
      console.log(`Getting locations for codes: ${codes.join(', ')}`);
      const data = await getCustomerLocationsByCodes(codes);
      console.log(`Found ${data.length} locations for provided codes`);
      return data;
    } catch (err) {
      console.error('Error getting locations by codes:', err);
      return [];
    }
  };

  // Auto-load on mount
  useEffect(() => {
    if (!isLoaded && !loading) {
      loadLocations();
    }
  }, [isLoaded, loading]);

  const hasData = locations.length > 0;

  const value: CustomersLocationContextType = {
    locations,
    loading,
    error,
    isLoaded,
    hasData,
    loadLocations,
    refreshLocations,
    getLocationsByCodes,
  };

  return (
    <CustomersLocationContext.Provider value={value}>
      {children}
    </CustomersLocationContext.Provider>
  );
}

export function useCustomersLocation() {
  const context = useContext(CustomersLocationContext);
  if (context === undefined) {
    throw new Error('useCustomersLocation must be used within a CustomersLocationProvider');
  }
  return context;
}
