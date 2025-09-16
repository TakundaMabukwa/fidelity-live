// Background data service for efficient real-time data fetching
// This service runs independently of the main UI thread

interface VehicleData {
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

interface DataServiceConfig {
  fetchInterval: number;
  maxRetries: number;
  retryDelay: number;
  enableWebSocket: boolean;
  enableHTTPFallback: boolean;
}

class BackgroundDataService {
  private config: DataServiceConfig;
  private isRunning = false;
  private fetchInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private lastFetchTime = 0;
  private dataCache: VehicleData[] = [];
  private listeners: Set<(data: VehicleData[]) => void> = new Set();

  constructor(config: Partial<DataServiceConfig> = {}) {
    this.config = {
      fetchInterval: 60000, // 60 seconds
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      enableWebSocket: true,
      enableHTTPFallback: true,
      ...config
    };
  }

  // Subscribe to data updates
  subscribe(callback: (data: VehicleData[]) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners of data updates
  private notifyListeners(data: VehicleData[]) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in data listener:', error);
      }
    });
  }

  // Fetch data from API with error handling and retries
  private async fetchData(): Promise<VehicleData[] | null> {
    try {
      const response = await fetch('/api/vehicles/realtime', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        this.retryCount = 0; // Reset retry count on success
        this.lastFetchTime = Date.now();
        return result.data;
      } else {
        throw new Error(result.error || 'Invalid response format');
      }
    } catch (error) {
      console.error('Background data fetch failed:', error);
      return null;
    }
  }

  // Start the background service
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🚀 Starting background data service...');
    
    // Initial fetch
    this.performFetch();
    
    // Set up interval for periodic fetching
    this.fetchInterval = setInterval(() => {
      this.performFetch();
    }, this.config.fetchInterval);
  }

  // Stop the background service
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    console.log('🛑 Stopping background data service...');
    
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
    }
  }

  // Perform a fetch operation with retry logic
  private async performFetch() {
    const data = await this.fetchData();
    
    if (data) {
      // Only update if data has changed to prevent unnecessary re-renders
      const hasChanged = JSON.stringify(this.dataCache) !== JSON.stringify(data);
      if (hasChanged) {
        this.dataCache = data;
        this.notifyListeners(data);
        console.log('📡 Background service: Vehicle data updated');
      }
    } else {
      // Handle retry logic
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Background service: Retry ${this.retryCount}/${this.config.maxRetries}`);
        
        setTimeout(() => {
          this.performFetch();
        }, this.config.retryDelay);
      } else {
        console.error('❌ Background service: Max retries reached');
        this.retryCount = 0; // Reset for next interval
      }
    }
  }

  // Get current cached data
  getCurrentData(): VehicleData[] {
    return this.dataCache;
  }

  // Force a data refresh
  async refresh(): Promise<VehicleData[] | null> {
    return await this.fetchData();
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      retryCount: this.retryCount,
      lastFetchTime: this.lastFetchTime,
      dataCount: this.dataCache.length,
      listenerCount: this.listeners.size
    };
  }
}

// Create singleton instance
export const backgroundDataService = new BackgroundDataService({
  fetchInterval: 60000, // 60 seconds
  maxRetries: 3,
  retryDelay: 5000,
  enableWebSocket: true,
  enableHTTPFallback: true
});

// Auto-start the service when module loads
if (typeof window !== 'undefined') {
  backgroundDataService.start();
}
