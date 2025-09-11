'use server';

import { createClient } from '@/lib/supabase/server';
import { Vehicle } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getVehicles(): Promise<Vehicle[]> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access vehicles data');
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('id, structure_name, registration_no, fleet_no, manufacturer, schedule')
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching vehicles:', error);
    throw new Error('Failed to fetch vehicles data');
  }

  revalidatePath('/protected/dashboard/vehicles');
  return data || [];
}

export async function getVehicleById(id: number): Promise<Vehicle | null> {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    throw new Error('Unauthorized: Please log in to access vehicles data');
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('id, structure_name, registration_no, fleet_no, manufacturer, schedule')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching vehicle:', error);
    return null;
  }

  return data;
}
