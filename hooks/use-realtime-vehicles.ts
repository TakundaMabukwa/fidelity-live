'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { REALTIME_CONFIG, WS_MESSAGE_TYPES, WS_SUBSCRIPTION_TYPES, CONNECTION_STATUS } from '@/lib/config/realtime';

export interface RealtimeVehicleData {
  id: number;
  plate: string;
  speed: number | null;
  latitude: string | null;
  longitude: string | null;
  loctime: string;
  quality: string | null;
  mileage: number | null;
  pocsagstr: string | null;
  head: string | null;
  geozone: string | null;
  drivername: string | null;
  nameevent: string | null;
  temperature: string | null;
  address: string | null;
  branch: string | null;
  created_at: string;
}

export interface ConnectionStatus {
  status: keyof typeof CONNECTION_STATUS;
  lastUpdate: Date | null;
  error: string | null;
  reconnectAttempts: number;
}

export interface UseRealtimeVehiclesReturn {
  vehicles: RealtimeVehicleData[];
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  reconnect: () => void;
  clearError: () => void;
}

const WEBSOCKET_URL = REALTIME_CONFIG.WEBSOCKET_URL;
const RECONNECT_INTERVAL = REALTIME_CONFIG.RECONNECT_INTERVAL;
const MAX_RECONNECT_ATTEMPTS = REALTIME_CONFIG.MAX_RECONNECT_ATTEMPTS;

export function useRealtimeVehicles(): UseRealtimeVehiclesReturn {
  const [vehicles, setVehicles] = useState<RealtimeVehicleData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'disconnected',
    lastUpdate: null,
    error: null,
    reconnectAttempts: 0
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  const isInitializedRef = useRef<boolean>(false);

  const clearError = useCallback(() => {
    setConnectionStatus(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Optimized function to fetch vehicle data via HTTP API with caching
  const fetchVehicleDataViaHTTP = useCallback(async (force = false) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    // Throttle requests to prevent excessive API calls (minimum 5 seconds between requests)
    if (!force && timeSinceLastFetch < 5000) {
      console.log('⏳ Throttling HTTP request, too soon since last fetch');
      return false;
    }

    try {
      console.log('🔄 Fetching vehicle data via HTTP...');
      lastFetchTimeRef.current = now;
      
      // Use our API route to avoid CORS issues
      const response = await fetch('/api/vehicles/realtime', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Only update state if data has actually changed to prevent unnecessary re-renders
        setVehicles(prev => {
          const hasChanged = JSON.stringify(prev) !== JSON.stringify(result.data);
          if (hasChanged) {
            console.log('✅ Vehicle data updated via HTTP:', result.data.length, 'vehicles');
            return result.data;
          }
          return prev;
        });
        
        setConnectionStatus(prev => ({
          ...prev,
          lastUpdate: new Date(),
          status: CONNECTION_STATUS.CONNECTED,
          error: null
        }));
        
        return true;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('❌ HTTP fetch failed:', error);
      setConnectionStatus(prev => ({
        ...prev,
        error: `HTTP fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
      return false;
    }
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('🔄 Connecting to WebSocket:', WEBSOCKET_URL);
    
    setConnectionStatus(prev => ({
      ...prev,
      status: CONNECTION_STATUS.CONNECTING,
      error: null
    }));

    try {
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        reconnectAttemptsRef.current = 0;
        setConnectionStatus(prev => ({
          ...prev,
          status: CONNECTION_STATUS.CONNECTED,
          error: null,
          reconnectAttempts: 0
        }));
        
        // Send ping to test connection
        try {
          ws.send(JSON.stringify({ type: WS_SUBSCRIPTION_TYPES.PING }));
          console.log('📡 Sent ping to WebSocket server');
        } catch (error) {
          console.error('❌ Failed to send ping:', error);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 Received WebSocket data:', data);

          // Handle different message types
          if (data.type === WS_MESSAGE_TYPES.VEHICLE_UPDATE && data.data) {
            // Handle Fidelity vehicle update format
            const vehicleData = data.data;
            setVehicles(prev => {
              const existingIndex = prev.findIndex(v => v.plate === vehicleData.Plate);
              if (existingIndex >= 0) {
                // Update existing vehicle
                const updated = [...prev];
                updated[existingIndex] = { 
                  ...updated[existingIndex], 
                  speed: vehicleData.Speed,
                  latitude: vehicleData.Latitude?.toString(),
                  longitude: vehicleData.Longitude?.toString(),
                  loctime: vehicleData.LocTime,
                  quality: vehicleData.Quality,
                  mileage: vehicleData.Mileage,
                  head: vehicleData.Head,
                  geozone: vehicleData.GeoZone,
                  drivername: vehicleData.DriverName,
                  nameevent: vehicleData.NameEvent,
                  temperature: vehicleData.Temperature,
                  address: vehicleData.Address,
                  branch: vehicleData.Branch
                };
                return updated;
              } else {
                // Add new vehicle (convert Fidelity format to our format)
                const newVehicle: RealtimeVehicleData = {
                  id: prev.length + 1, // Temporary ID
                  plate: vehicleData.Plate,
                  speed: vehicleData.Speed,
                  latitude: vehicleData.Latitude?.toString(),
                  longitude: vehicleData.Longitude?.toString(),
                  loctime: vehicleData.LocTime,
                  quality: vehicleData.Quality,
                  mileage: vehicleData.Mileage,
                  pocsagstr: vehicleData.PocsagStr,
                  head: vehicleData.Head,
                  geozone: vehicleData.GeoZone,
                  drivername: vehicleData.DriverName,
                  nameevent: vehicleData.NameEvent,
                  temperature: vehicleData.Temperature,
                  address: vehicleData.Address,
                  branch: vehicleData.Branch,
                  created_at: new Date().toISOString()
                };
                return [...prev, newVehicle];
              }
            });

            setConnectionStatus(prev => ({
              ...prev,
              lastUpdate: new Date()
            }));
          } else if (data.type === WS_MESSAGE_TYPES.DATABASE_NOTIFICATION) {
            // Handle database notifications - refresh data
            console.log('📡 Database notification received, refreshing data...');
            fetchVehicleDataViaHTTP();
          } else if (data.type === WS_MESSAGE_TYPES.PONG) {
            // Handle pong response
            console.log('📡 Received pong from server');
            setConnectionStatus(prev => ({
              ...prev,
              lastUpdate: new Date()
            }));
          } else if (data.type === WS_MESSAGE_TYPES.CONNECTION) {
            // Handle connection confirmation
            console.log('📡 Connection confirmed by server');
            setConnectionStatus(prev => ({
              ...prev,
              lastUpdate: new Date()
            }));
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        wsRef.current = null;

        if (event.code !== 1000) { // Not a normal closure
          setConnectionStatus(prev => ({
            ...prev,
            status: CONNECTION_STATUS.DISCONNECTED,
            error: `Connection closed: ${event.reason || 'Unknown reason'}`
          }));

          // Attempt to reconnect
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttemptsRef.current++;
            const delay = Math.min(RECONNECT_INTERVAL * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
            
            console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})`);
            
            setConnectionStatus(prev => ({
              ...prev,
              reconnectAttempts: reconnectAttemptsRef.current
            }));

            reconnectTimeoutRef.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            setConnectionStatus(prev => ({
              ...prev,
              status: CONNECTION_STATUS.ERROR,
              error: 'Max reconnection attempts reached'
            }));
          }
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('❌ WebSocket readyState:', ws.readyState);
        console.error('❌ WebSocket URL:', WEBSOCKET_URL);
        
        // Try HTTP fallback immediately on WebSocket error
        console.log('🔄 WebSocket failed, attempting HTTP fallback...');
        fetchVehicleDataViaHTTP();
        
        setConnectionStatus(prev => ({
          ...prev,
          status: CONNECTION_STATUS.ERROR,
          error: 'WebSocket connection failed - using HTTP fallback'
        }));
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      console.log('🔄 WebSocket creation failed, attempting HTTP fallback...');
      
      // Try HTTP fallback if WebSocket creation fails
      fetchVehicleDataViaHTTP();
      
      setConnectionStatus(prev => ({
        ...prev,
        status: CONNECTION_STATUS.ERROR,
        error: 'WebSocket creation failed - using HTTP fallback'
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setConnectionStatus(prev => ({
      ...prev,
      status: CONNECTION_STATUS.DISCONNECTED,
      error: null
    }));
  }, []);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectAttemptsRef.current = 0;
    setTimeout(connect, 1000);
  }, [connect, disconnect]);

  // Initial connection - start with HTTP to get data immediately, then try WebSocket
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    // First, fetch initial data via HTTP
    fetchVehicleDataViaHTTP(true).then((success) => {
      if (success) {
        console.log('✅ Initial data loaded via HTTP, now attempting WebSocket connection...');
      }
    });

    // Then try WebSocket connection
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect, fetchVehicleDataViaHTTP]);

  // Set up optimized periodic HTTP fallback when WebSocket is not connected
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus.status !== CONNECTION_STATUS.CONNECTED) {
        console.log('🔄 WebSocket not connected, fetching data via HTTP fallback...');
        fetchVehicleDataViaHTTP();
      }
    }, 20000); // Every 20 seconds to reduce server load

    return () => clearInterval(interval);
  }, [connectionStatus.status, fetchVehicleDataViaHTTP]);

  // Set up background data refresh for WebSocket connections (less frequent)
  useEffect(() => {
    if (connectionStatus.status !== CONNECTION_STATUS.CONNECTED) return;

    const interval = setInterval(() => {
      // Periodic refresh even when WebSocket is connected to ensure data consistency
      fetchVehicleDataViaHTTP();
    }, 60000); // Every 60 seconds for background refresh

    return () => clearInterval(interval);
  }, [connectionStatus.status, fetchVehicleDataViaHTTP]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    vehicles,
    connectionStatus,
    isConnected: connectionStatus.status === CONNECTION_STATUS.CONNECTED,
    reconnect,
    clearError
  };
}
