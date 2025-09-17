'use server';

import { createClient } from '@/lib/supabase/server';
import { Customer } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Test function to check available tables
export async function testDatabaseConnection(): Promise<{ success: boolean; message: string; tables?: string[] }> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, message: 'Unauthorized: Please log in to access database' };
  }

  try {
    // First, try to access the specific table directly
    console.log('Testing direct access to customers_duration table...');
    const { data: testData, error: testError } = await supabase
      .from('customers_duration')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Direct table access failed:', testError);
      return { 
        success: false, 
        message: `Cannot access customers_duration table: ${testError.message}` 
      };
    }

    // If direct access works, try to get column information
    console.log('Direct table access successful, checking columns...');
    const { data: columnData, error: columnError } = await supabase
      .from('customers_duration')
      .select('*')
      .limit(1);

    if (columnError) {
      console.error('Column access failed:', columnError);
      return { 
        success: false, 
        message: `Table exists but column access failed: ${columnError.message}` 
      };
    }

    // Get table information
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%customer%');

    if (error) {
      console.error('Error fetching table info:', error);
      return { success: false, message: `Database error: ${error.message}` };
    }

    const tables = data?.map(t => t.table_name) || [];
    return { 
      success: true, 
      message: `Successfully connected to customers_duration table. Found ${tables.length} customer-related tables.`, 
      tables 
    };
  } catch (err) {
    console.error('Exception testing database:', err);
    return { success: false, message: `Exception: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access customers data');
  }

  // Use the correct table name: public.customers_duration
  console.log('Fetching from table: public.customers_duration');
  
  const { data, error } = await supabase
    .from('customers_duration')
    .select(`
      id,
      type,
      code,
      customer,
      status,
      status_time,
      hours,
      "h/c",
      min,
      "m/c",
      sec,
      duration_in_sec,
      duration,
      collection_bags,
      delivery_bags
    `)
    .order('id', { ascending: true })
    .limit(1000);

  if (error) {
    console.error('Error fetching customers:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    
    // Try a simpler query to test basic connectivity
    console.log('Trying simple query to test connectivity...');
    const { data: testData, error: testError } = await supabase
      .from('customers_duration')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('Simple query also failed:', testError);
      throw new Error(`Failed to fetch customers data: ${error.message}. Simple query also failed: ${testError.message}`);
    } else {
      console.log('Simple query succeeded, issue might be with specific columns');
      throw new Error(`Failed to fetch customers data: ${error.message}. Basic connectivity works but specific columns failed.`);
    }
  }

  console.log(`Successfully fetched ${data?.length || 0} customers from public.customers_duration`);
  revalidatePath('/protected/dashboard/customers');
  return data || [];
}

// Simple function to test basic table access
export async function testBasicTableAccess(): Promise<{ success: boolean; message: string; sampleData?: any }> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, message: 'Unauthorized: Please log in to access database' };
  }

  try {
    // Try to get just one record with all columns
    const { data, error } = await supabase
      .from('customers_duration')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing customers_duration table:', error);
      return { 
        success: false, 
        message: `Failed to access table: ${error.message}` 
      };
    }

    return { 
      success: true, 
      message: `Successfully accessed customers_duration table. Found ${data?.length || 0} records.`,
      sampleData: data?.[0] || null
    };
  } catch (err) {
    console.error('Exception testing table access:', err);
    return { 
      success: false, 
      message: `Exception: ${err instanceof Error ? err.message : 'Unknown error'}` 
    };
  }
}

export async function getCustomersPaginated(
  page: number = 1, 
  pageSize: number = 50
): Promise<{ data: Customer[]; total: number; page: number; pageSize: number }> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access customers data');
  }

  const offset = (page - 1) * pageSize;

  // Performance optimization: Use count and range for pagination
  const [countResult, dataResult] = await Promise.all([
    supabase
      .from('customers_duration')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('customers_duration')
      .select(`
        id,
        type,
        code,
        customer,
        status,
        status_time,
        hours,
        "h/c",
        min,
        "m/c",
        sec,
        duration_in_sec,
        duration,
        collection_bags,
        delivery_bags
      `)
      .order('id', { ascending: true })
      .range(offset, offset + pageSize - 1)
  ]);

  if (countResult.error) {
    console.error('Error counting customers:', countResult.error);
    throw new Error(`Failed to count customers data: ${countResult.error.message}`);
  }

  if (dataResult.error) {
    console.error('Error fetching customers:', dataResult.error);
    throw new Error(`Failed to fetch customers data: ${dataResult.error.message}`);
  }

  revalidatePath('/protected/dashboard/customers');
  
  return {
    data: dataResult.data || [],
    total: countResult.count || 0,
    page,
    pageSize
  };
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access customers data');
  }

  const { data, error } = await supabase
    .from('customers_duration')
    .select(`
      id,
      type,
      code,
      customer,
      status,
      status_time,
      hours,
      "h/c",
      min,
      "m/c",
      sec,
      duration_in_sec,
      duration,
      collection_bags,
      delivery_bags
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching customer:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    return null;
  }

  return data;
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access customers data');
  }

  // Performance optimization: Use text search with limit
  const { data, error } = await supabase
    .from('customers_duration')
    .select(`
      id,
      type,
      code,
      customer,
      status,
      status_time,
      hours,
      "h/c",
      min,
      "m/c",
      sec,
      duration_in_sec,
      duration,
      collection_bags,
      delivery_bags
    `)
    .or(`customer.ilike.%${query}%,code.ilike.%${query}%,type.ilike.%${query}%`)
    .order('id', { ascending: true })
    .limit(100); // Limit search results for performance

  if (error) {
    console.error('Error searching customers:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to search customers data: ${error.message}`);
  }

  return data || [];
}

export async function updateCustomerDuration(
  id: number,
  updates: Partial<Customer>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const allowedKeys = new Set([
    'type','code','customer','status','status_time','hours','h/c','min','m/c','sec',
    'duration_in_sec','duration','start_time','announce_time','planned_arrival','planned_depart','actual_arrival',
    'collection_bags','delivery_bags'
  ]);

  const payload: Record<string, any> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (!allowedKeys.has(key)) return;
    payload[key] = value === '' ? null : value;
  });

  if (Object.keys(payload).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from('customers_duration')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('Error updating customers_duration:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}
