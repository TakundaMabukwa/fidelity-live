'use server';

import { createClient } from '@/lib/supabase/server';
import { Driver } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getDrivers(): Promise<Driver[]> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access driver data');
  }

  const { data, error } = await supabase
    .from('drivers')
    .select('no, comp_no, surname, initial, full_names, cell')
    .order('no', { ascending: true });

  if (error) {
    console.error('Error fetching drivers:', error);
    throw new Error('Failed to fetch drivers data');
  }

  revalidatePath('/protected/dashboard/drivers');
  return data || [];
}

export async function getDriverById(id: number): Promise<Driver | null> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access driver data');
  }

  const { data, error } = await supabase
    .from('drivers')
    .select('no, comp_no, surname, initial, full_names, cell')
    .eq('no', id)
    .single();

  if (error) {
    console.error('Error fetching driver:', error);
    return null;
  }

  return data;
}
