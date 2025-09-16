'use server';

import { createClient } from '@/lib/supabase/server';

// =====================================================
// DELIVERY MONITORING ACTIONS (INTEGRATED WITH EXISTING TABLES)
// =====================================================

export interface VehicleStop {
  id: number;
  vehicle_registration: string;
  latitude: number;
  longitude: number;
  stop_start_time: string;
  stop_end_time: string | null;
  duration_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerDeliveryStatus {
  id: number;
  sequence_order: number;
  customer_name: string;
  customer_code: string;
  vehicle_registration: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  customer_latitude: number | null;
  customer_longitude: number | null;
  stop_start_time: string | null;
  stop_end_time: string | null;
  stop_duration_minutes: number | null;
  distance_from_customer_meters: number | null;
  delivery_completed_at: string | null;
  auto_completed: boolean;
  estimated_arrival_time: string | null;
  actual_arrival_time: string | null;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  service_notes: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// VEHICLE STOP TRACKING
// =====================================================

/**
 * Start tracking a vehicle stop
 */
export async function startVehicleStop(data: {
  vehicle_registration: string;
  latitude: number;
  longitude: number;
}): Promise<{ success: boolean; data?: VehicleStop; error?: string }> {
  try {
    const supabase = await createClient();
    
    // First, end any active stops for this vehicle
    await supabase
      .from('vehicle_stops')
      .update({ 
        is_active: false, 
        stop_end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vehicle_registration', data.vehicle_registration)
      .eq('is_active', true);

    // Create new stop record
    const { data: stop, error } = await supabase
      .from('vehicle_stops')
      .insert({
        vehicle_registration: data.vehicle_registration,
        latitude: data.latitude,
        longitude: data.longitude,
        stop_start_time: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting vehicle stop:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: stop };
  } catch (error) {
    console.error('Unexpected error in startVehicleStop:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * End tracking a vehicle stop
 */
export async function endVehicleStop(vehicle_registration: string): Promise<{ success: boolean; data?: VehicleStop; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { data: stop, error } = await supabase
      .from('vehicle_stops')
      .update({ 
        is_active: false, 
        stop_end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('vehicle_registration', vehicle_registration)
      .eq('is_active', true)
      .select()
      .single();

    if (error) {
      console.error('Error ending vehicle stop:', error);
      return { success: false, error: error.message };
    }

    if (stop) {
      // Calculate duration in minutes
      const startTime = new Date(stop.stop_start_time);
      const endTime = new Date(stop.stop_end_time!);
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

      // Update with calculated duration
      const { data: updatedStop, error: updateError } = await supabase
        .from('vehicle_stops')
        .update({ 
          duration_minutes: durationMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('id', stop.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating stop duration:', updateError);
        return { success: false, error: updateError.message };
      }

      return { success: true, data: updatedStop };
    }

    return { success: false, error: 'No active stop found for this vehicle' };
  } catch (error) {
    console.error('Unexpected error in endVehicleStop:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get active stops for a vehicle
 */
export async function getActiveVehicleStop(vehicle_registration: string): Promise<{ success: boolean; data?: VehicleStop; error?: string }> {
  try {
    const supabase = await createClient();
    
    const { data: stop, error } = await supabase
      .from('vehicle_stops')
      .select('*')
      .eq('vehicle_registration', vehicle_registration)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting active vehicle stop:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: stop || null };
  } catch (error) {
    console.error('Unexpected error in getActiveVehicleStop:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =====================================================
// DELIVERY COMPLETION TRACKING
// =====================================================

/**
 * Get delivery completions for a vehicle on a specific date
 */
export async function getDeliveryCompletions(
  vehicle_registration: string, 
  date?: string
): Promise<{ success: boolean; data?: DeliveryCompletion[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data: completions, error } = await supabase
      .from('delivery_completions')
      .select('*')
      .eq('vehicle_registration', vehicle_registration)
      .eq('delivery_date', targetDate)
      .order('completion_time', { ascending: false });

    if (error) {
      console.error('Error getting delivery completions:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: completions || [] };
  } catch (error) {
    console.error('Unexpected error in getDeliveryCompletions:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =====================================================
// CUSTOMER DELIVERY STATUS
// =====================================================

/**
 * Get customer delivery status for a vehicle (from assigned_route_customers)
 */
export async function getCustomerDeliveryStatus(
  vehicle_registration: string, 
  date?: string
): Promise<{ success: boolean; data?: CustomerDeliveryStatus[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data: statuses, error } = await supabase
      .from('assigned_route_customers')
      .select(`
        id,
        sequence_order,
        status,
        customer_latitude,
        customer_longitude,
        stop_start_time,
        stop_end_time,
        stop_duration_minutes,
        distance_from_customer_meters,
        delivery_completed_at,
        auto_completed,
        estimated_arrival_time,
        actual_arrival_time,
        estimated_duration_minutes,
        actual_duration_minutes,
        service_notes,
        created_at,
        updated_at,
        customer_stops!inner(customer, code),
        assigned_routes!inner(
          vehicles!inner(registration_no)
        )
      `)
      .eq('assigned_routes.vehicles.registration_no', vehicle_registration)
      .eq('assigned_routes.status', 'active')
      .gte('assigned_routes.assigned_at', `${targetDate}T00:00:00`)
      .lt('assigned_routes.assigned_at', `${targetDate}T23:59:59`)
      .order('sequence_order', { ascending: true });

    if (error) {
      console.error('Error getting customer delivery status:', error);
      return { success: false, error: error.message };
    }

    // Transform the data to match our interface
    const transformedData = statuses?.map(item => ({
      id: item.id,
      sequence_order: item.sequence_order,
      customer_name: item.customer_stops.customer,
      customer_code: item.customer_stops.code,
      vehicle_registration: item.assigned_routes.vehicles.registration_no,
      status: item.status,
      customer_latitude: item.customer_latitude,
      customer_longitude: item.customer_longitude,
      stop_start_time: item.stop_start_time,
      stop_end_time: item.stop_end_time,
      stop_duration_minutes: item.stop_duration_minutes,
      distance_from_customer_meters: item.distance_from_customer_meters,
      delivery_completed_at: item.delivery_completed_at,
      auto_completed: item.auto_completed,
      estimated_arrival_time: item.estimated_arrival_time,
      actual_arrival_time: item.actual_arrival_time,
      estimated_duration_minutes: item.estimated_duration_minutes,
      actual_duration_minutes: item.actual_duration_minutes,
      service_notes: item.service_notes,
      created_at: item.created_at,
      updated_at: item.updated_at
    })) || [];

    return { success: true, data: transformedData };
  } catch (error) {
    console.error('Unexpected error in getCustomerDeliveryStatus:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get all customer delivery statuses for a specific date
 */
export async function getAllCustomerDeliveryStatus(
  date?: string
): Promise<{ success: boolean; data?: CustomerDeliveryStatus[]; error?: string }> {
  try {
    const supabase = await createClient();
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data: statuses, error } = await supabase
      .from('customer_delivery_status')
      .select('*')
      .eq('delivery_date', targetDate)
      .order('vehicle_registration', { ascending: true })
      .order('customer_name', { ascending: true });

    if (error) {
      console.error('Error getting all customer delivery status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: statuses || [] };
  } catch (error) {
    console.error('Unexpected error in getAllCustomerDeliveryStatus:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update customer delivery status
 */
export async function updateCustomerDeliveryStatus(
  customer_id: number,
  delivery_date: string,
  status: 'pending' | 'in_progress' | 'completed' | 'failed',
  notes?: string
): Promise<{ success: boolean; data?: CustomerDeliveryStatus; error?: string }> {
  try {
    const supabase = await createClient();
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'in_progress' && !updateData.started_at) {
      updateData.started_at = new Date().toISOString();
    }

    if (status === 'completed' && !updateData.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    if (notes) {
      updateData.notes = notes;
    }

    const { data: status_record, error } = await supabase
      .from('customer_delivery_status')
      .update(updateData)
      .eq('customer_id', customer_id)
      .eq('delivery_date', delivery_date)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer delivery status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: status_record };
  } catch (error) {
    console.error('Unexpected error in updateCustomerDeliveryStatus:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// =====================================================
// DELIVERY MONITORING UTILITIES
// =====================================================

/**
 * Initialize customer delivery status for a vehicle's assigned customers
 */
export async function initializeCustomerDeliveryStatus(
  vehicle_registration: string,
  customer_ids: number[],
  date?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get customer details
    const { data: customers, error: customerError } = await supabase
      .from('customer_stops')
      .select('id, code, customer')
      .in('id', customer_ids);

    if (customerError) {
      console.error('Error getting customer details:', customerError);
      return { success: false, error: customerError.message };
    }

    if (!customers || customers.length === 0) {
      return { success: false, error: 'No customers found' };
    }

    // Prepare status records
    const statusRecords = customers.map(customer => ({
      customer_id: customer.id,
      customer_code: customer.code,
      customer_name: customer.customer,
      vehicle_registration,
      delivery_date: targetDate,
      status: 'pending' as const,
      assigned_at: new Date().toISOString()
    }));

    // Insert status records (ignore conflicts for existing records)
    const { error: insertError } = await supabase
      .from('customer_delivery_status')
      .upsert(statusRecords, { 
        onConflict: 'customer_id,delivery_date',
        ignoreDuplicates: false 
      });

    if (insertError) {
      console.error('Error inserting customer delivery status:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error in initializeCustomerDeliveryStatus:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get delivery statistics for a vehicle on a specific date (from assigned_route_customers)
 */
export async function getDeliveryStatistics(
  vehicle_registration: string,
  date?: string
): Promise<{ 
  success: boolean; 
  data?: {
    total_customers: number;
    completed_deliveries: number;
    pending_deliveries: number;
    failed_deliveries: number;
    completion_rate: number;
    average_stop_duration: number;
  }; 
  error?: string 
}> {
  try {
    const supabase = await createClient();
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data: statuses, error } = await supabase
      .from('assigned_route_customers')
      .select('status, stop_duration_minutes')
      .eq('assigned_routes.vehicles.registration_no', vehicle_registration)
      .eq('assigned_routes.status', 'active')
      .gte('assigned_routes.assigned_at', `${targetDate}T00:00:00`)
      .lt('assigned_routes.assigned_at', `${targetDate}T23:59:59`);

    if (error) {
      console.error('Error getting delivery statistics:', error);
      return { success: false, error: error.message };
    }

    if (!statuses || statuses.length === 0) {
      return { 
        success: true, 
        data: {
          total_customers: 0,
          completed_deliveries: 0,
          pending_deliveries: 0,
          failed_deliveries: 0,
          completion_rate: 0,
          average_stop_duration: 0
        }
      };
    }

    const total_customers = statuses.length;
    const completed_deliveries = statuses.filter(s => s.status === 'completed').length;
    const pending_deliveries = statuses.filter(s => s.status === 'pending').length;
    const failed_deliveries = statuses.filter(s => s.status === 'failed').length;
    const completion_rate = total_customers > 0 ? (completed_deliveries / total_customers) * 100 : 0;
    
    const completedWithDuration = statuses.filter(s => s.status === 'completed' && s.stop_duration_minutes);
    const average_stop_duration = completedWithDuration.length > 0 
      ? completedWithDuration.reduce((sum, s) => sum + (s.stop_duration_minutes || 0), 0) / completedWithDuration.length
      : 0;

    return { 
      success: true, 
      data: {
        total_customers,
        completed_deliveries,
        pending_deliveries,
        failed_deliveries,
        completion_rate,
        average_stop_duration
      }
    };
  } catch (error) {
    console.error('Unexpected error in getDeliveryStatistics:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
