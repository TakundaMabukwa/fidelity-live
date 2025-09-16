import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Route: Fetching customer stops...');
    
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
    
    // Get code parameter from query string
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    let query = supabase
      .from('customer_stops')
      .select('id, customer, avg_seconds, avg_minutes, code')
      .order('customer');
    
    // Filter by code if provided
    if (code) {
      query = query.eq('code', code);
      console.log('🔍 Filtering by code:', code);
    }
    
    const { data: customerStops, error: customerStopsError } = await query;

    if (customerStopsError) {
      console.error('❌ Error fetching customer stops:', customerStopsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customer stops' },
        { status: 500 }
      );
    }

    console.log('✅ Customer stops fetched:', customerStops?.length || 0);
    
    return NextResponse.json({
      success: true,
      data: customerStops || [],
      count: customerStops?.length || 0,
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
