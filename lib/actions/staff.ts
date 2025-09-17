'use server';

import { createClient } from '@/lib/supabase/server';
import { Staff } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getStaff(): Promise<Staff[]> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access staff data');
  }

  const { data, error } = await supabase
    .from('staff')
    .select('id, comp_no, surname, initial, full_names, cell, job_description_remarks')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching staff:', error);
    throw new Error('Failed to fetch staff data');
  }

  revalidatePath('/protected/dashboard/staff');
  return data || [];
}

export async function getStaffById(id: number): Promise<Staff | null> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access staff data');
  }

  const { data, error } = await supabase
    .from('staff')
    .select('id, comp_no, surname, initial, full_names, cell, job_description_remarks')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching staff member:', error);
    return null;
  }

  return data;
}

export async function updateStaff(
  id: number,
  updates: Partial<Staff & { id_number?: string; admin?: string }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const allowedKeys = new Set([
    'comp_no','surname','initial','full_names','id_number','cell','job_description_remarks','admin','no'
  ]);

  const payload: Record<string, any> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (!allowedKeys.has(key)) return;
    if (key === 'id') return; // don't allow id change
    payload[key] = value === '' ? null : value;
  });

  if (Object.keys(payload).length === 0) {
    return { success: true };
  }

  const { error } = await supabase
    .from('staff')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('Error updating staff:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/protected/dashboard/staff');
  return { success: true };
}