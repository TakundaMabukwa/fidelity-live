'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface CustomerLocation {
  id: number;
  type: string | null;
  code: string | null;
  customer: string | null;
  lat: string[] | null;
  lon: string[] | null;
  direction: string | null;
}

export async function getCustomersLocation(): Promise<CustomerLocation[]> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access customers location data');
  }

  console.log('Fetching from table: customers_location');
  
  const { data, error } = await supabase
    .from('customers_location')
    .select(`
      id,
      type,
      code,
      customer,
      lat,
      lon,
      direction
    `)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching customers location:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to fetch customers location data: ${error.message}`);
  }

  console.log(`Successfully fetched ${data?.length || 0} customer locations from customers_location`);
  revalidatePath('/protected/dashboard/route-assignment');
  return data || [];
}

export async function getCustomerLocationByCode(code: string): Promise<CustomerLocation | null> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access customers location data');
  }

  const { data, error } = await supabase
    .from('customers_location')
    .select(`
      id,
      type,
      code,
      customer,
      lat,
      lon,
      direction
    `)
    .eq('code', code)
    .single();

  if (error) {
    console.error('Error fetching customer location by code:', error);
    return null;
  }

  return data;
}

export async function getCustomerLocationsByCodes(codes: string[]): Promise<CustomerLocation[]> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access customers location data');
  }

  if (codes.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('customers_location')
    .select(`
      id,
      type,
      code,
      customer,
      lat,
      lon,
      direction
    `)
    .in('code', codes);

  if (error) {
    console.error('Error fetching customer locations by codes:', error);
    throw new Error(`Failed to fetch customer locations: ${error.message}`);
  }

  return data || [];
}
