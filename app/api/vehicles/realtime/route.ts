import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

// Simple in-memory cache to reduce API calls
let cache: {
  data: any;
  timestamp: number;
  ttl: number;
} | null = null;

const CACHE_TTL = 10000; // 10 seconds cache

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check cache first
    const now = Date.now();
    if (cache && (now - cache.timestamp) < cache.ttl) {
      console.log('📦 Returning cached vehicle data');
      return NextResponse.json({
        ...cache.data,
        cached: true,
        cacheAge: now - cache.timestamp
      });
    }
    
    console.log('🔄 Fetching fresh vehicle data from Fidelity API...');
    
    // Fetch vehicles from Fidelity real-time API
    const fidelityUrl = 'http://64.227.138.235:8003/api/vehicles/realtime';
    
    try {
      const response = await fetch(fidelityUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Reduced timeout for better performance
        signal: AbortSignal.timeout(6000), // 6 second timeout
      });

      if (!response.ok) {
        throw new Error(`Fidelity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(`Fidelity API error: ${data.error}`);
      }

      // Cache the successful response
      const responseData = {
        success: true,
        data: data.data || [],
        count: data.count || 0,
        timestamp: data.timestamp || new Date().toISOString(),
        realtime: data.realtime || null,
        source: 'fidelity_realtime_api'
      };

      cache = {
        data: responseData,
        timestamp: now,
        ttl: CACHE_TTL
      };

      console.log('✅ Real-time vehicles fetched and cached:', data.data?.length || 0);
      
      return NextResponse.json(responseData);

    } catch (fetchError) {
      console.error('❌ Failed to fetch from Fidelity API:', fetchError);
      
      // Return cached data if available, even if expired
      if (cache) {
        console.log('📦 Returning stale cached data due to API error');
        return NextResponse.json({
          ...cache.data,
          cached: true,
          stale: true,
          error: 'Using cached data due to API error'
        });
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch real-time vehicle data',
          details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    
    // Return cached data if available
    if (cache) {
      console.log('📦 Returning cached data due to unexpected error');
      return NextResponse.json({
        ...cache.data,
        cached: true,
        stale: true,
        error: 'Using cached data due to server error'
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
