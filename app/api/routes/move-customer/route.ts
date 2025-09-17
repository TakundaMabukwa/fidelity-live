import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { customerId, targetRouteId } = body as { customerId: number; targetRouteId: number };

    if (!customerId || !targetRouteId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get target route to read its LocationCode
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('LocationCode')
      .eq('id', targetRouteId)
      .single();

    if (routeError || !route) {
      return NextResponse.json({ success: false, error: 'Target route not found' }, { status: 404 });
    }

    // Update the customer stop to new code = route.LocationCode
    const { error: updateError } = await supabase
      .from('customer_stops')
      .update({ code: route.LocationCode })
      .eq('id', customerId);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}


