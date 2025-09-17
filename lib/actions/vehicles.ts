'use server';

import { createClient } from '@/lib/supabase/server';
import { Vehicle } from '@/lib/types';

export async function getVehicles(): Promise<{
  success: boolean;
  data?: Vehicle[];
  error?: string;
}> {
  try {
    console.log('🔄 Server Action: Fetching vehicles from database...');
    
    const supabase = await createClient();
    
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('registration_no');

    if (error) {
      console.error('❌ Error fetching vehicles:', error);
      return {
        success: false,
        error: 'Failed to fetch vehicles from database'
      };
    }

    console.log('✅ Vehicles fetched from database:', vehicles?.length || 0);
    
    return {
      success: true,
      data: vehicles || []
    };
  } catch (error) {
    console.error('❌ Server Action error:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

export async function updateVehicle(
  id: number,
  updates: Partial<Vehicle & { branch?: string }>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const allowedKeys = new Set([
      'structure_name','registration_no','fleet_no','manufacturer','schedule','branch'
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
      .from('vehicles')
      .update(payload)
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getVehicleByPlate(plate: string): Promise<{
  success: boolean;
  data?: Vehicle | null;
  error?: string;
}> {
  try {
    console.log('🔄 Server Action: Fetching vehicle by plate:', plate);
    
    const supabase = await createClient();
    
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('registration_no', plate)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        console.log('ℹ️ No vehicle found with plate:', plate);
        return {
          success: true,
          data: null
        };
      }
      
      console.error('❌ Error fetching vehicle by plate:', error);
      return {
        success: false,
        error: 'Failed to fetch vehicle from database'
      };
    }

    console.log('✅ Vehicle fetched by plate:', vehicle?.registration_no);
    
    return {
      success: true,
      data: vehicle
    };
  } catch (error) {
    console.error('❌ Server Action error:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}