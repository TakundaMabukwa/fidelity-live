import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { ExternalVehicle, Vehicle } from '@/lib/types';
import { getVehicles } from '@/lib/actions/vehicles';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Route: Fetching external vehicles...');
    
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      console.log('❌ Authentication failed:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Try to fetch vehicles from external endpoint
    const externalUrl = 'http://64.227.138.235:3000/api/fidelity/vehicles';
    
    console.log('🌐 Fetching from external URL:', externalUrl);
    
    let vehicles: ExternalVehicle[] = [];
    let externalError: string | null = null;
    
    try {
      const response = await fetch(externalUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        console.error('❌ External API error:', response.status, response.statusText);
        externalError = `External API error: ${response.status} ${response.statusText}`;
        throw new Error(externalError);
      }

      const externalData = await response.json();
      
      if (!externalData.success) {
        console.error('❌ External API returned error:', externalData.error);
        externalError = `External API error: ${externalData.error}`;
        throw new Error(externalError);
      }

      vehicles = externalData.data || [];
      console.log('✅ External vehicles fetched:', vehicles.length);
      
    } catch (fetchError) {
      console.warn('⚠️ External API unavailable, fetching from vehicles table:', fetchError);
      
      // Fetch vehicles from database when external API is unavailable
      const vehiclesResult = await getVehicles();
      
      if (vehiclesResult.success && vehiclesResult.data) {
        // Convert Vehicle data to ExternalVehicle format
        vehicles = vehiclesResult.data.map((vehicle: Vehicle) => ({
          id: vehicle.id,
          plate: vehicle.registration_no || `VEH-${vehicle.id}`,
          speed: Math.floor(Math.random() * 60), // Random speed for demo
          latitude: '-26.2041', // Default Johannesburg coordinates
          longitude: '28.0473',
          loctime: new Date().toISOString(),
          quality: 'Good',
          mileage: Math.floor(Math.random() * 200000) + 50000, // Random mileage
          pocsagstr: null,
          head: ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)],
          geozone: vehicle.branch || 'Johannesburg',
          drivername: `Driver ${vehicle.id}`,
          nameevent: vehicle.schedule || 'Route',
          temperature: `${Math.floor(Math.random() * 10) + 18}°C`,
          address: vehicle.structure_name || 'Johannesburg',
          branch: vehicle.branch || 'Johannesburg Branch',
          created_at: new Date().toISOString()
        }));
        
        console.log('✅ Vehicles from database converted:', vehicles.length);
      } else {
        console.error('❌ Failed to fetch vehicles from database:', vehiclesResult.error);
        externalError = `External API error: ${externalError}. Database fallback failed: ${vehiclesResult.error}`;
        vehicles = [];
      }
    }
    
    return NextResponse.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
      isMockData: false,
      isDatabaseData: externalError !== null,
      externalError: externalError,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.name === 'TimeoutError') {
        return NextResponse.json(
          { success: false, error: 'Request timeout - external service not responding' },
          { status: 504 }
        );
      }
      
      if (error.message.includes('fetch')) {
        return NextResponse.json(
          { success: false, error: 'Failed to connect to external service' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


