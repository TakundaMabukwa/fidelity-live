'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Staff } from '@/lib/types';
import { getStaff } from '@/lib/actions/staff';

interface StaffContextType {
  staff: Staff[];
  loading: boolean;
  error: string | null;
  isLoaded: boolean;
  loadStaff: () => Promise<void>;
  refreshStaff: () => Promise<void>;
  hasData: boolean;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadStaff = useCallback(async () => {
    // If data is already loaded, don't reload unless explicitly requested
    if (isLoaded && staff.length > 0) {
      console.log('Staff data already cached, using existing data');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getStaff();
      setStaff(data);
      setIsLoaded(true);
      console.log('Staff data loaded and cached');
    } catch (err) {
      console.error('Error loading staff:', err);
      setError(err instanceof Error ? err.message : 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, [isLoaded, staff.length]);

  const refreshStaff = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getStaff();
      setStaff(data);
      setIsLoaded(true);
      console.log('Staff data refreshed and cached');
    } catch (err) {
      console.error('Error refreshing staff:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh staff');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <StaffContext.Provider
      value={{
        staff,
        loading,
        error,
        isLoaded,
        loadStaff,
        refreshStaff,
        hasData: staff.length > 0,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaff must be used within a StaffProvider');
  }
  return context;
}
