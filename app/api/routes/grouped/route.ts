import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';
import { GroupedRoute } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Route: Fetching grouped routes...');
    
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
    
    // Create server-side Supabase client
    const supabase = await createClient();
    
    // Fetch all routes
    const { data: routes, error: routesError } = await supabase
      .from('routes')
      .select('*')
      .order('Route');

    if (routesError) {
      console.error('❌ Error fetching routes:', routesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch routes' },
        { status: 500 }
      );
    }

    console.log('✅ Routes fetched:', routes?.length || 0);

    // Fetch all customer stops
    const { data: customerStops, error: customerStopsError } = await supabase
      .from('customer_stops')
      .select('id, customer, avg_seconds, avg_minutes, code');

    if (customerStopsError) {
      console.error('❌ Error fetching customer stops:', customerStopsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customer stops' },
        { status: 500 }
      );
    }

    console.log('✅ Customer stops fetched:', customerStops?.length || 0);

    // Group routes by LocationCode
    const groupedRoutesMap = new Map<string, GroupedRoute>();

    routes?.forEach(route => {
      const locationCode = route.LocationCode || 'Unknown';
      
      if (!groupedRoutesMap.has(locationCode)) {
        groupedRoutesMap.set(locationCode, {
          locationCode,
          routes: [],
          customers: []
        });
      }
      
      groupedRoutesMap.get(locationCode)!.routes.push(route);
    });

    // Add customers to each group based on code matching
    customerStops?.forEach(customerStop => {
      if (customerStop.code) {
        // Find all groups that have routes with matching LocationCode
        groupedRoutesMap.forEach(group => {
          const hasMatchingRoute = group.routes.some(route => 
            route.LocationCode === customerStop.code
          );
          
          if (hasMatchingRoute) {
            group.customers.push(customerStop);
          }
        });
      }
    });

    const groupedRoutes = Array.from(groupedRoutesMap.values());

    console.log('✅ Grouped routes created:', groupedRoutes.length);
    
    return NextResponse.json({
      success: true,
      data: groupedRoutes,
      count: groupedRoutes.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
