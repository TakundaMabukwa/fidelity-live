'use server';

import { createClient } from '@/lib/supabase/server';

export interface RouteTimingData {
  id?: number;
  route_id: number;
  assigned_route_id?: number;
  vehicle_id: number;
  route_name: string;
  vehicle_registration: string;
  estimated_total_time_minutes: number;
  actual_total_time_minutes?: number;
  time_difference_minutes?: number;
  efficiency_percentage?: number;
  route_status: 'active' | 'completed' | 'cancelled' | 'paused';
  completion_status: 'pending' | 'completed' | 'incomplete' | 'failed';
  route_start_time?: string;
  route_end_time?: string;
  base_arrival_time?: string;
  total_stops?: number;
  completed_stops?: number;
  notes?: string;
  metadata?: any;
}

export interface RouteTimingSummary {
  route_name: string;
  vehicle_registration: string;
  estimated_time: number;
  actual_time?: number;
  time_difference?: number;
  efficiency_percentage?: number;
  completion_status: string;
  upload_date: string;
}

/**
 * Get vehicle base departure time (when base = false)
 */
export async function getVehicleBaseDepartureTime(vehicleRegistration: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    // Get the latest base departure time for the vehicle today
    const { data, error } = await supabase
      .from('fidelity_live_feed')
      .select('updated_at')
      .eq('Plate', vehicleRegistration)
      .eq('base', false)
      .gte('updated_at', new Date().toISOString().split('T')[0]) // Today's date
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.log('No base departure time found for vehicle:', vehicleRegistration);
      return null;
    }

    return data.updated_at;
  } catch (error) {
    console.error('Error getting vehicle base departure time:', error);
    return null;
  }
}

/**
 * Get vehicle base arrival time (when base = true)
 */
export async function getVehicleBaseArrivalTime(vehicleRegistration: string): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    // Get the latest base arrival time for the vehicle today
    const { data, error } = await supabase
      .from('fidelity_live_feed')
      .select('updated_at')
      .eq('Plate', vehicleRegistration)
      .eq('base', true)
      .gte('updated_at', new Date().toISOString().split('T')[0]) // Today's date
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.log('No base arrival time found for vehicle:', vehicleRegistration);
      return null;
    }

    return data.updated_at;
  } catch (error) {
    console.error('Error getting vehicle base arrival time:', error);
    return null;
  }
}

/**
 * Get route timing data for assigned routes
 */
export async function getAssignedRouteTimingData(): Promise<RouteTimingData[]> {
  try {
    const supabase = await createClient();
    
    // Get all active assigned routes with their details
    const { data: assignedRoutes, error } = await supabase
      .from('assigned_routes')
      .select(`
        id,
        vehicle_id,
        route_id,
        total_estimated_duration_minutes,
        actual_start_time,
        actual_end_time,
        status,
        vehicles!inner (
          id,
          registration_no
        ),
        routes!inner (
          id,
          Route
        )
      `)
      .eq('status', 'active')
      .gte('assigned_at', new Date().toISOString().split('T')[0]); // Today's assignments

    if (error) {
      console.error('Error fetching assigned routes:', error);
      throw new Error('Failed to fetch assigned routes');
    }

    if (!assignedRoutes || assignedRoutes.length === 0) {
      return [];
    }

    // Get timing data for all vehicles
    const routeTimingData: RouteTimingData[] = [];
    
    for (const route of assignedRoutes) {
      // Get base departure and arrival times
      const baseDepartureTime = await getVehicleBaseDepartureTime(route.vehicles.registration_no);
      const baseArrivalTime = await getVehicleBaseArrivalTime(route.vehicles.registration_no);
      
      // Calculate estimated time from customer averages
      const { data: customerData } = await supabase
        .from('assigned_route_customers')
        .select('estimated_duration_minutes')
        .eq('assigned_route_id', route.id);

      const estimatedTotalTimeMinutes = customerData?.reduce((sum, customer) => 
        sum + (customer.estimated_duration_minutes || 0), 0) || 0;
      
      // Calculate actual time from base departure to base arrival
      let actualTotalTimeMinutes: number | undefined;
      if (baseDepartureTime && baseArrivalTime) {
        const startTime = new Date(baseDepartureTime);
        const endTime = new Date(baseArrivalTime);
        actualTotalTimeMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
      }

      // Get stop counts
      const { data: stopData } = await supabase
        .from('assigned_route_customers')
        .select('id, status')
        .eq('assigned_route_id', route.id);

      const totalStops = stopData?.length || 0;
      const completedStops = stopData?.filter(stop => stop.status === 'completed').length || 0;

      // Calculate derived values
      const timeDifferenceMinutes = actualTotalTimeMinutes ? 
        actualTotalTimeMinutes - estimatedTotalTimeMinutes : null;
      
      const efficiencyPercentage = actualTotalTimeMinutes && estimatedTotalTimeMinutes > 0 ?
        Math.round((estimatedTotalTimeMinutes / actualTotalTimeMinutes) * 100 * 100) / 100 : null;

      routeTimingData.push({
        route_id: route.route_id,
        assigned_route_id: route.id,
        vehicle_id: route.vehicle_id,
        route_name: route.routes.Route || 'Unknown Route',
        vehicle_registration: route.vehicles.registration_no,
        estimated_total_time_minutes: estimatedTotalTimeMinutes,
        actual_total_time_minutes: actualTotalTimeMinutes,
        time_difference_minutes: timeDifferenceMinutes,
        efficiency_percentage: efficiencyPercentage,
        route_status: route.status as any,
        completion_status: baseArrivalTime ? 'completed' : 'incomplete',
        route_start_time: baseDepartureTime,
        route_end_time: baseArrivalTime,
        base_arrival_time: baseArrivalTime,
        total_stops: totalStops,
        completed_stops: completedStops,
        metadata: {
          assigned_at: route.assigned_at,
          route_id: route.route_id
        }
      });
    }

    return routeTimingData;
  } catch (error) {
    console.error('Error in getAssignedRouteTimingData:', error);
    throw error;
  }
}

/**
 * Create route timing log entry
 */
export async function createRouteTimingLog(timingData: Omit<RouteTimingData, 'id'>): Promise<RouteTimingData> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('route_timing_logs')
      .insert([timingData])
      .select()
      .single();

    if (error) {
      console.error('Error creating route timing log:', error);
      throw new Error('Failed to create route timing log');
    }

    return data;
  } catch (error) {
    console.error('Error in createRouteTimingLog:', error);
    throw error;
  }
}

/**
 * Create multiple route timing logs
 */
export async function createRouteTimingLogs(timingDataArray: Omit<RouteTimingData, 'id'>[]): Promise<RouteTimingData[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('route_timing_logs')
      .insert(timingDataArray)
      .select();

    if (error) {
      console.error('Error creating route timing logs:', error);
      throw new Error('Failed to create route timing logs');
    }

    return data || [];
  } catch (error) {
    console.error('Error in createRouteTimingLogs:', error);
    throw error;
  }
}

/**
 * Log route timing data for all assigned routes (called during upload)
 */
export async function logRouteTimingData(): Promise<{
  success: boolean;
  message: string;
  data?: RouteTimingSummary[];
  error?: string;
}> {
  try {
    console.log('🕒 Starting route timing data collection...');
    
    // Get all assigned route timing data
    const timingData = await getAssignedRouteTimingData();
    
    if (timingData.length === 0) {
      return {
        success: true,
        message: 'No active assigned routes found for timing analysis',
        data: []
      };
    }

    // Create timing logs
    const createdLogs = await createRouteTimingLogs(timingData);
    
    // Format summary data
    const summaryData: RouteTimingSummary[] = createdLogs.map(log => ({
      route_name: log.route_name,
      vehicle_registration: log.vehicle_registration,
      estimated_time: log.estimated_total_time_minutes,
      actual_time: log.actual_total_time_minutes,
      time_difference: log.actual_total_time_minutes ? 
        log.actual_total_time_minutes - log.estimated_total_time_minutes : undefined,
      efficiency_percentage: log.actual_total_time_minutes && log.estimated_total_time_minutes > 0 ?
        Math.round((log.estimated_total_time_minutes / log.actual_total_time_minutes) * 100 * 100) / 100 : undefined,
      completion_status: log.completion_status,
      upload_date: log.created_at
    }));

    console.log(`✅ Successfully logged timing data for ${createdLogs.length} routes`);
    
    return {
      success: true,
      message: `Successfully logged timing data for ${createdLogs.length} routes`,
      data: summaryData
    };
  } catch (error) {
    console.error('❌ Error logging route timing data:', error);
    return {
      success: false,
      message: 'Failed to log route timing data',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get route timing logs for display
 */
export async function getRouteTimingLogs(limit: number = 100, offset: number = 0): Promise<RouteTimingData[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('route_timing_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching route timing logs:', error);
      throw new Error('Failed to fetch route timing logs');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRouteTimingLogs:', error);
    throw error;
  }
}

/**
 * Get route timing performance summary
 */
export async function getRouteTimingPerformance(days: number = 7): Promise<{
  route_performance: any[];
  vehicle_performance: any[];
  overall_stats: any;
}> {
  try {
    const supabase = await createClient();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get route performance summary
    const { data: routePerformance, error: routeError } = await supabase
      .from('route_timing_logs')
      .select(`
        route_name,
        estimated_total_time_minutes,
        actual_total_time_minutes,
        time_difference_minutes,
        efficiency_percentage,
        completion_status
      `)
      .gte('created_at', startDate.toISOString())
      .eq('completion_status', 'completed');

    if (routeError) {
      console.error('Error fetching route performance:', routeError);
      throw new Error('Failed to fetch route performance data');
    }

    // Get vehicle performance summary
    const { data: vehiclePerformance, error: vehicleError } = await supabase
      .from('route_timing_logs')
      .select(`
        vehicle_registration,
        efficiency_percentage,
        completion_status
      `)
      .gte('created_at', startDate.toISOString());

    if (vehicleError) {
      console.error('Error fetching vehicle performance:', vehicleError);
      throw new Error('Failed to fetch vehicle performance data');
    }

    // Calculate overall stats
    const completedRoutes = routePerformance?.filter(r => r.completion_status === 'completed') || [];
    const avgEfficiency = completedRoutes.length > 0 ? 
      completedRoutes.reduce((sum, r) => sum + (r.efficiency_percentage || 0), 0) / completedRoutes.length : 0;
    
    const overallStats = {
      total_routes: routePerformance?.length || 0,
      completed_routes: completedRoutes.length,
      avg_efficiency: Math.round(avgEfficiency * 100) / 100,
      avg_time_difference: completedRoutes.length > 0 ?
        Math.round(completedRoutes.reduce((sum, r) => sum + (r.time_difference_minutes || 0), 0) / completedRoutes.length) : 0
    };

    return {
      route_performance: routePerformance || [],
      vehicle_performance: vehiclePerformance || [],
      overall_stats: overallStats
    };
  } catch (error) {
    console.error('Error in getRouteTimingPerformance:', error);
    throw error;
  }
}
