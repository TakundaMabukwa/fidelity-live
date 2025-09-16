import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Route: Fetching routes and customers for today...');
    console.log('🔍 Request URL:', request.url);
    console.log('🔍 Request method:', request.method);
    
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
    
    // Get today's day name (e.g., 'monday', 'tuesday', etc.)
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    console.log('📅 Today is:', dayName);
    
    // First, get all routes
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
    console.log('🔍 Sample route data:', routes?.slice(0, 2));

    // Let's also check if there are any customers in customer_stops
    const { data: allCustomers, error: customersError } = await supabase
      .from('customer_stops')
      .select('id, customer, avg_seconds, avg_minutes, code')
      .limit(5);
    
    console.log('🔍 Sample customer data:', allCustomers);
    console.log('🔍 Total customers in customer_stops:', allCustomers?.length || 0);

    // Group routes by LocationCode
    const groupedRoutes = new Map();
    
    (routes || []).forEach(route => {
      const locationCode = route.LocationCode;
      if (!groupedRoutes.has(locationCode)) {
        groupedRoutes.set(locationCode, {
          locationCode,
          routes: [],
          customers: [],
          customerCount: 0
        });
      }
      groupedRoutes.get(locationCode).routes.push(route);
    });

    console.log('✅ Routes grouped by LocationCode:', groupedRoutes.size);

    // For each location group, get customers
    const locationGroups = await Promise.all(
      Array.from(groupedRoutes.values()).map(async (group) => {
        try {
          // Get customers for this location code
          const { data: customers, error: customersError } = await supabase
            .from('customer_stops')
            .select('id, customer, avg_seconds, avg_minutes, code')
            .eq('code', group.locationCode) // Match location code with customer code
            .order('customer');

          if (customersError) {
            console.error(`❌ Error fetching customers for location ${group.locationCode}:`, customersError);
            return {
              ...group,
              customers: [],
              customerCount: 0
            };
          }

          console.log(`✅ Customers for location ${group.locationCode}:`, customers?.length || 0);
          
          return {
            ...group,
            customers: customers || [],
            customerCount: customers?.length || 0
          };
        } catch (error) {
          console.error(`❌ Error processing location ${group.locationCode}:`, error);
          return {
            ...group,
            customers: [],
            customerCount: 0
          };
        }
      })
    );

    const totalCustomers = locationGroups.reduce((sum, group) => sum + group.customerCount, 0);
    const totalRoutes = locationGroups.reduce((sum, group) => sum + group.routes.length, 0);
    
    console.log('✅ Total location groups:', locationGroups.length);
    console.log('✅ Total routes:', totalRoutes);
    console.log('✅ Total customers for today:', totalCustomers);

    return NextResponse.json({
      success: true,
      data: {
        locationGroups,
        totalLocationGroups: locationGroups.length,
        totalRoutes,
        totalCustomers,
        day: dayName,
        date: today.toISOString().split('T')[0]
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in today routes API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
