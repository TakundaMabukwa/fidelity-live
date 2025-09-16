// API utility functions for vehicle data

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://64.227.138.235:3000/api';

export interface VehicleData {
  id: number;
  plate: string;
  speed: number | null;
  latitude: string | null;
  longitude: string | null;
  loctime: string | null;
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

export interface ApiResponse {
  success: boolean;
  data: VehicleData[];
  count: number;
  timestamp: string;
}

export async function fetchVehicles(): Promise<VehicleData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/fidelity/vehicles`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error('API returned unsuccessful response');
    }
    
    return result.data;
  } catch (error) {
    console.error('Failed to fetch vehicles:', error);
    throw error;
  }
}

export async function fetchLateVehicles(): Promise<VehicleData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/macsteel/late-vehicles`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Late vehicles endpoint not found, returning empty array');
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result: ApiResponse = await response.json();
    
    if (!result.success) {
      throw new Error('API returned unsuccessful response');
    }
    
    return result.data;
  } catch (error) {
    console.warn('Late vehicles endpoint not available:', error);
    // Return empty array if late vehicles endpoint doesn't exist or fails
    return [];
  }
}
