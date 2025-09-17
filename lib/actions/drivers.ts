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

export async function updateDriver(
  no: number,
  updates: Partial<Driver & { id_number?: string; job_description_remarks?: string; admin?: string }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Only allow specific columns present in the table
  const allowedKeys = new Set([
    'no','comp_no','surname','initial','full_names','id_number','cell','job_description_remarks','admin'
  ]);

  const payload: Record<string, any> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (!allowedKeys.has(key)) return;
    if (key === 'no') return; // do not allow changing primary business key here
    payload[key] = value === '' ? null : value;
  });

  if (Object.keys(payload).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from('drivers')
    .update(payload)
    .eq('no', no);

  if (error) {
    console.error('Error updating driver:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/protected/dashboard/drivers');
  return { success: true };
}