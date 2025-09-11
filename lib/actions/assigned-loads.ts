'use server';

import { createClient } from '@/lib/supabase/server';
import { AssignedLoad } from '@/lib/types';

export async function createAssignedLoad(load: Omit<AssignedLoad, 'id'>) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('assigned_loads')
    .insert([load])
    .select()
    .single();

  if (error) {
    console.error('Error creating assigned load:', error);
    throw new Error('Failed to create assigned load');
  }

  return data;
}

export async function createAssignedLoads(loads: Omit<AssignedLoad, 'id'>[]) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('assigned_loads')
    .insert(loads)
    .select();

  if (error) {
    console.error('Error creating assigned loads:', error);
    throw new Error('Failed to create assigned loads');
  }

  return data;
}

export async function getAssignedLoads() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('assigned_loads')
    .select('*')
    .ilike('reject_fault', 'CIT ERROR')
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching assigned loads:', error);
    throw new Error('Failed to fetch assigned loads');
  }

  return data;
}

export async function getAssignedLoadsByDay(day: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('assigned_loads')
    .select('*')
    .eq('day', day)
    .ilike('reject_fault', 'CIT ERROR')
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching assigned loads by day:', error);
    throw new Error('Failed to fetch assigned loads by day');
  }

  return data;
}

export async function deleteAssignedLoadsByDay(day: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('assigned_loads')
    .delete()
    .eq('day', day);

  if (error) {
    console.error('Error deleting assigned loads by day:', error);
    throw new Error('Failed to delete assigned loads by day');
  }

  return true;
}
