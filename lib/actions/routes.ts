'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Route {
  id: number;
  created_at: string;
  Route: string | null;
  LocationCode: string | null;
  ServiceDays: string | null;
  userGroup: string | null;
  WeekNumber: string | null;
  StartDate: string | null;
  EndDate: string | null;
  Inactive: boolean | null;
  LastUpdated: string | null;
  LastUpdatedUser: string | null;
  RouteId: string | null;
}

export interface CustomerDuration {
  id: number;
  type: string | null;
  code: string | null;
  customer: string | null;
  status: string | null;
  status_time: string | null;
  hours: string | null;
  actual_arrival: string | null;
  collection_bags: string | null;
  delivery_bags: string | null;
}

export async function getRoutes(): Promise<Route[]> {
  try {
    const supabase = await createClient();
    
    console.log('Fetching all active routes...');
    
    // Get all active routes first
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .eq('Inactive', false)
      .order('Route', { ascending: true });

    if (error) {
      console.error('Error fetching routes:', error);
      throw new Error('Failed to fetch routes');
    }

    console.log('Found routes:', data?.length || 0);
    
    // For now, return all active routes without date filtering
    // This will help us see what routes are available
    return data || [];
  } catch (error) {
    console.error('Error in getRoutes:', error);
    throw error;
  }
}

export async function getAllRoutes(): Promise<Route[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('routes')
      .select('*')
      .order('Route', { ascending: true });
    if (error) {
      console.error('Error fetching all routes:', error);
      throw new Error('Failed to fetch routes');
    }
    return data || [];
  } catch (error) {
    console.error('Error in getAllRoutes:', error);
    throw error;
  }
}

export async function updateRoute(
  id: number,
  updates: Partial<Route>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const allowedKeys = new Set([
      'Route','LocationCode','ServiceDays','userGroup','WeekNumber','StartDate','EndDate','Inactive','RouteId'
    ]);
    const payload: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (!allowedKeys.has(key)) return;
      payload[key] = typeof value === 'string' ? value.trim() : value;
    });
    if (Object.keys(payload).length === 0) return { success: true };
    const { error } = await supabase
      .from('routes')
      .update(payload)
      .eq('id', id);
    if (error) return { success: false, error: error.message };
    revalidatePath('/protected/dashboard/editable-routes');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export async function getCustomersByLocationCode(locationCode: string): Promise<CustomerDuration[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('customers_duration')
      .select('*')
      .eq('code', locationCode)
      .order('customer', { ascending: true });

    if (error) {
      console.error('Error fetching customers:', error);
      throw new Error('Failed to fetch customers');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCustomersByLocationCode:', error);
    throw error;
  }
}

export interface VehicleAssignment {
  id: number;
  vehicle_registration: string;
  route_id: number;
  route_name: string;
  location_code: string | null;
  assigned_at: string;
  assigned_by: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleAssignmentCustomer {
  id: number;
  assignment_id: number;
  customer_id: number;
  customer_name: string | null;
  customer_code: string | null;
  customer_type: string | null;
  customer_status: string | null;
  customer_hours: string | null;
  customer_arrival: string | null;
  collection_bags: string | null;
  delivery_bags: string | null;
  created_at: string;
}

export async function assignCustomersToVehicle(
  vehicleRegistration: string, 
  route: Route, 
  customers: CustomerDuration[]
): Promise<void> {
  try {
    const supabase = await createClient();
    
    console.log(`Assigning ${customers.length} customers to vehicle ${vehicleRegistration} for route ${route.Route}`);
    
    // Create vehicle assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('vehicle_assignments')
      .insert({
        vehicle_registration: vehicleRegistration,
        route_id: route.id,
        route_name: route.Route || 'Unnamed Route',
        location_code: route.LocationCode,
        status: 'active'
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating vehicle assignment:', assignmentError);
      throw new Error('Failed to create vehicle assignment');
    }

    // Insert customer details for this assignment
    if (customers.length > 0) {
      const customerData = customers.map(customer => ({
        assignment_id: assignment.id,
        customer_id: customer.id,
        customer_name: customer.customer,
        customer_code: customer.code,
        customer_type: customer.type,
        customer_status: customer.status,
        customer_hours: customer.hours,
        customer_arrival: customer.actual_arrival,
        collection_bags: customer.collection_bags,
        delivery_bags: customer.delivery_bags
      }));

      const { error: customersError } = await supabase
        .from('vehicle_assignment_customers')
        .insert(customerData);

      if (customersError) {
        console.error('Error inserting customer assignments:', customersError);
        throw new Error('Failed to assign customers');
      }
    }

    console.log(`Successfully assigned ${customers.length} customers to vehicle ${vehicleRegistration}`);
    
  } catch (error) {
    console.error('Error in assignCustomersToVehicle:', error);
    throw error;
  }
}

export async function getVehicleAssignments(vehicleRegistration: string): Promise<VehicleAssignment[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('vehicle_assignments')
      .select('*')
      .eq('vehicle_registration', vehicleRegistration)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching vehicle assignments:', error);
      throw new Error('Failed to fetch vehicle assignments');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getVehicleAssignments:', error);
    throw error;
  }
}

export async function getVehicleAssignmentCustomers(assignmentId: number): Promise<VehicleAssignmentCustomer[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('vehicle_assignment_customers')
      .select('*')
      .eq('assignment_id', assignmentId)
      .order('customer_name', { ascending: true });

    if (error) {
      console.error('Error fetching assignment customers:', error);
      throw new Error('Failed to fetch assignment customers');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getVehicleAssignmentCustomers:', error);
    throw error;
  }
}

export async function updateRoute(
  id: number,
  updates: Partial<Route>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const allowedKeys = new Set([
      'Route','LocationCode','ServiceDays','userGroup','WeekNumber','StartDate','EndDate','Inactive','RouteId'
    ]);
    const payload: Record<string, any> = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (!allowedKeys.has(key)) return;
      payload[key] = typeof value === 'string' ? value.trim() : value;
    });
    if (Object.keys(payload).length === 0) return { success: true };

    const { error } = await supabase
      .from('routes')
      .update(payload)
      .eq('id', id);

    if (error) return { success: false, error: error.message };

    revalidatePath('/protected/dashboard');
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}