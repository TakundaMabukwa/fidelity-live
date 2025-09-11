'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface LiveFeedData {
  Plate: string;
  Speed: number;
  Latitude: number;
  Longitude: number;
  LocTime: string;
  Quality: string;
  Mileage: number;
  Pocsagstr: string;
  Head: string;
  Geozone: string;
  DriverName: string;
  NameEvent: string;
  Temperature: string;
  Address: string;
}

interface UseLiveFeedReturn {
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
}

const LIVE_FEED_URL = 'http://64.227.138.235:8003/latest';
const POLLING_INTERVAL = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds
const LIVE_FEED_ENABLED = false; // Live feed is disabled

export function useLiveFeed(): UseLiveFeedReturn {
  const [liveData, setLiveData] = useState<LiveFeedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLiveData = useCallback(async (isRetry = false) => {
    // Live feed is disabled
    if (!LIVE_FEED_ENABLED) {
      console.log('Live feed is disabled');
      return;
    }
    
    if (loading && !isRetry) return; // Prevent multiple simultaneous requests
    
    setLoading(true);
    
    try {
      console.log('Fetching live data...', { retryCount, isRetry });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(LIVE_FEED_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LiveFeedData = await response.json();
      
      // Validate data structure
      if (data && typeof data === 'object' && data.Plate) {
        setLiveData(data);
        setLastUpdated(new Date());
        setIsConnected(true);
        setError(null);
        setRetryCount(0);
        console.log('Live data updated:', data);
      } else {
        console.log('No valid data received, continuing to poll...');
        setError(null); // Don't treat empty data as error
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch live data';
      console.error('Live feed fetch error:', err);
      
      setError(errorMessage);
      setIsConnected(false);
      
      // Implement retry logic
      if (retryCount < MAX_RETRIES) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        
        console.log(`Retrying in ${RETRY_DELAY}ms (attempt ${newRetryCount}/${MAX_RETRIES})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchLiveData(true);
        }, RETRY_DELAY);
      } else {
        console.log('Max retries reached, continuing to poll...');
        setRetryCount(0); // Reset for next polling cycle
      }
    } finally {
      setLoading(false);
    }
  }, [loading, retryCount]);

  const refresh = useCallback(() => {
    setRetryCount(0);
    fetchLiveData();
  }, [fetchLiveData]);

  const startPolling = useCallback(() => {
    if (!LIVE_FEED_ENABLED) {
      console.log('Live feed is disabled - cannot start polling');
      return;
    }
    
    if (isPolling) return; // Already polling
    
    console.log('Starting live feed polling...');
    setIsPolling(true);
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Start polling immediately
    fetchLiveData();
    
    // Set up interval for continuous polling
    intervalRef.current = setInterval(() => {
      fetchLiveData();
    }, POLLING_INTERVAL);
  }, [isPolling, fetchLiveData]);

  const stopPolling = useCallback(() => {
    console.log('Stopping live feed polling...');
    setIsPolling(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  return {
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
  };
}
