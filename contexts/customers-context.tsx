'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Customer } from '@/lib/types';
import { getCustomers } from '@/lib/actions/customers';

interface CustomersContextType {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  isLoaded: boolean;
  loadCustomers: () => Promise<void>;
  refreshCustomers: () => Promise<void>;
  hasData: boolean;
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export function CustomersProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadCustomers = useCallback(async () => {
    // If data is already loaded, don't reload unless explicitly requested
    if (isLoaded && customers.length > 0) {
      console.log('Customers data already cached, using existing data');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getCustomers();
      setCustomers(data);
      setIsLoaded(true);
      console.log('Customers data loaded and cached');
    } catch (err) {
      console.error('Error loading customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, customers.length]);

  const refreshCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getCustomers();
      setCustomers(data);
      setIsLoaded(true);
      console.log('Customers data refreshed and cached');
    } catch (err) {
      console.error('Error refreshing customers:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh customers');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <CustomersContext.Provider
      value={{
        customers,
        loading,
        error,
        isLoaded,
        loadCustomers,
        refreshCustomers,
        hasData: customers.length > 0,
      }}
    >
      {children}
    </CustomersContext.Provider>
  );
}

export function useCustomers() {
  const context = useContext(CustomersContext);
  if (context === undefined) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
}