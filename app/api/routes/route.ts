import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 API Route: Fetching all routes...');
    
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
    
    return NextResponse.json({
      success: true,
      data: routes || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in routes API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
