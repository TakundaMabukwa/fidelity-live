// Real-time vehicle tracking configuration
export const REALTIME_CONFIG = {
  // WebSocket URL for real-time vehicle data (subscription-based)
  WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://64.227.138.235:8003/realtime',
  
  // Raw TCP WebSocket URL (alternative)
  TCP_WEBSOCKET_URL: process.env.NEXT_PUBLIC_TCP_WEBSOCKET_URL || 'ws://64.227.138.235:8003/ws',
  
  // HTTP API URL for vehicle data fallback
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://64.227.138.235:8003/api',
  
  // External tracking API URL
  EXTERNAL_API_URL: process.env.NEXT_PUBLIC_EXTERNAL_API_URL || 'http://64.227.138.235:3000/api/fidelity/vehicles',
  
  // WebSocket connection settings
  RECONNECT_INTERVAL: parseInt(process.env.NEXT_PUBLIC_WS_RECONNECT_INTERVAL || '5000'),
  MAX_RECONNECT_ATTEMPTS: parseInt(process.env.NEXT_PUBLIC_WS_MAX_RECONNECT_ATTEMPTS || '10'),
  TIMEOUT: parseInt(process.env.NEXT_PUBLIC_WS_TIMEOUT || '10000'),
  
  // Data refresh intervals
  VEHICLE_DATA_REFRESH: 30000, // 30 seconds
  CONNECTION_HEALTH_CHECK: 60000, // 1 minute
  
  // UI settings
  SHOW_CONNECTION_STATUS: true,
  ENABLE_AUTO_RECONNECT: true,
  SHOW_LAST_UPDATE_TIME: true,
  ENABLE_VEHICLE_FILTERING: true,
};

// Message types for WebSocket communication
export const WS_MESSAGE_TYPES = {
  VEHICLE_UPDATE: 'vehicle_update',
  VEHICLES_BATCH: 'vehicles_batch',
  HEARTBEAT: 'heartbeat',
  CONNECTION_STATUS: 'connection_status',
  ERROR: 'error',
  // Fidelity-specific message types
  CONNECTION: 'connection',
  DATABASE_NOTIFICATION: 'database_notification',
  VEHICLE_LOCATION_CHANGE: 'vehicle_location_change',
  PONG: 'pong',
} as const;

// WebSocket subscription types
export const WS_SUBSCRIPTION_TYPES = {
  SUBSCRIBE_VEHICLE: 'subscribe_vehicle',
  UNSUBSCRIBE_VEHICLE: 'unsubscribe_vehicle',
  SUBSCRIBE_DRIVER: 'subscribe_driver',
  UNSUBSCRIBE_DRIVER: 'unsubscribe_driver',
  SUBSCRIBE_LOCATION: 'subscribe_location',
  UNSUBSCRIBE_LOCATION: 'unsubscribe_location',
  PING: 'ping',
} as const;

// Vehicle status types
export const VEHICLE_STATUS = {
  ACTIVE: 'active',
  STOPPED: 'stopped',
  OFFLINE: 'offline',
  STALE: 'stale',
  MAINTENANCE: 'maintenance',
} as const;

// Connection status types
export const CONNECTION_STATUS = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
} as const;

