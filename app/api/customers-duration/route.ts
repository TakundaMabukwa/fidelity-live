import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    console.log('API called with code:', code, 'page:', page, 'pageSize:', pageSize);

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Location code is required' },
        { status: 400 }
      );
    }

    // Validate pagination parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('Authentication error:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Please log in to access customer data' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // First, let's check if the table exists and has any data
    const { data: testData, error: testError } = await supabase
      .from('customer_stops')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Table access error:', testError);
      return NextResponse.json(
        { success: false, error: `Table access error: ${testError.message}` },
        { status: 500 }
      );
    }

    console.log('Table access successful, test data:', testData);

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;

    // Get total count and paginated data in parallel
    const [countResult, dataResult] = await Promise.all([
      supabase
        .from('customer_stops')
        .select('*', { count: 'exact', head: true })
        .eq('code', code),
      supabase
        .from('customer_stops')
        .select('id, customer, stops, code')
        .eq('code', code)
        .order('customer', { ascending: true })
        .range(offset, offset + pageSize - 1)
    ]);

    if (countResult.error) {
      console.error('Count query error:', countResult.error);
      return NextResponse.json(
        { success: false, error: `Count query error: ${countResult.error.message}` },
        { status: 500 }
      );
    }

    if (dataResult.error) {
      console.error('Data query error:', dataResult.error);
      return NextResponse.json(
        { success: false, error: `Data query error: ${dataResult.error.message}` },
        { status: 500 }
      );
    }

    const totalCount = countResult.count || 0;
    const data = dataResult.data || [];
    const totalPages = Math.ceil(totalCount / pageSize);

    console.log('Query successful, found', data.length, 'customers for code:', code, 'out of', totalCount, 'total');

    return NextResponse.json({
      success: true,
      data: data,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
