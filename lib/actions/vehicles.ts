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