'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useLiveFeed, LiveFeedData } from '@/hooks/use-live-feed';
import { Vehicle } from '@/lib/types';

interface LiveFeedContextType {
  liveData: LiveFeedData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void;
  isConnected: boolean;
  retryCount: number;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  getVehicleLiveData: (vehicle: Vehicle) => LiveFeedData | null;
  getLiveDataByPlate: (plate: string) => LiveFeedData | null;
}

const LiveFeedContext = createContext<LiveFeedContextType | undefined>(undefined);

export function LiveFeedProvider({ children }: { children: React.ReactNode }) {
  const { liveData, loading, error, lastUpdated, refresh, isConnected, retryCount, isPolling, startPolling, stopPolling } = useLiveFeed();

  const getVehicleLiveData = useMemo(() => {
    return (vehicle: Vehicle): LiveFeedData | null => {
      if (!liveData || !vehicle.registration_no) return null;
      
      // Match by registration number (Plate field from feed)
      return liveData.Plate === vehicle.registration_no ? liveData : null;
    };
  }, [liveData]);

  const getLiveDataByPlate = useMemo(() => {
    return (plate: string): LiveFeedData | null => {
      if (!liveData) return null;
      
      return liveData.Plate === plate ? liveData : null;
    };
  }, [liveData]);

  const value = {
    liveData,
    loading,
    error,
    lastUpdated,
    refresh,
    isConnected,
    retryCount,
    isPolling,
    startPolling,
    stopPolling,
    getVehicleLiveData,
    getLiveDataByPlate,
  };

  return (
    <LiveFeedContext.Provider value={value}>
      {children}
    </LiveFeedContext.Provider>
  );
}

export function useLiveFeedContext() {
  const context = useContext(LiveFeedContext);
  if (context === undefined) {
    throw new Error('useLiveFeedContext must be used within a LiveFeedProvider');
  }
  return context;
}
