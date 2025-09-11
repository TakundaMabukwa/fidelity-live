'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AssignedLoad } from '@/lib/types';
import { getAssignedLoads, getAssignedLoadsByDay } from '@/lib/actions/assigned-loads';

interface AssignedLoadsContextType {
  assignedLoads: AssignedLoad[];
  loading: boolean;
  error: string | null;
  loadAssignedLoads: () => Promise<void>;
  loadAssignedLoadsByDay: (day: string) => Promise<void>;
  refreshAssignedLoads: () => Promise<void>;
  isLoaded: boolean;
  hasData: boolean;
}

const AssignedLoadsContext = createContext<AssignedLoadsContextType | undefined>(undefined);

export function AssignedLoadsProvider({ children }: { children: React.ReactNode }) {
  const [assignedLoads, setAssignedLoads] = useState<AssignedLoad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadAssignedLoads = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getAssignedLoads();
      setAssignedLoads(data || []);
      setIsLoaded(true);
    } catch (err) {
      console.error('Error loading assigned loads:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assigned loads');
      setAssignedLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedLoadsByDay = async (day: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getAssignedLoadsByDay(day);
      setAssignedLoads(data || []);
      setIsLoaded(true);
    } catch (err) {
      console.error('Error loading assigned loads by day:', err);
      setError(err instanceof Error ? err.message : 'Failed to load assigned loads by day');
      setAssignedLoads([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshAssignedLoads = async () => {
    await loadAssignedLoads();
  };

  const hasData = assignedLoads.length > 0;

  return (
    <AssignedLoadsContext.Provider
      value={{
        assignedLoads,
        loading,
        error,
        loadAssignedLoads,
        loadAssignedLoadsByDay,
        refreshAssignedLoads,
        isLoaded,
        hasData,
      }}
    >
      {children}
    </AssignedLoadsContext.Provider>
  );
}

export function useAssignedLoads() {
  const context = useContext(AssignedLoadsContext);
  if (context === undefined) {
    throw new Error('useAssignedLoads must be used within an AssignedLoadsProvider');
  }
  return context;
}
