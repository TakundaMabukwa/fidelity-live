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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const q = searchParams.get('q');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const limit = Math.max(1, Math.min(1000, Number(limitParam ?? '1000'))); // default high if not provided
    const offset = Math.max(0, Number(offsetParam ?? '0'));
    
    let query = supabase
      .from('customer_stops')
      .select('id, customer, avg_seconds, avg_minutes, code')
      .order('customer');
    
    // Filter by code if provided
    if (code) {
      query = query.eq('code', code);
      console.log('🔍 Filtering by code:', code);
    }
    if (q && q.trim() !== '') {
      query = query.ilike('customer', `%${q}%`);
    }
    // Apply pagination
    query = query.range(offset, offset + limit - 1);
    
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
      limit,
      offset,
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
