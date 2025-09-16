'use server';

import { createClient } from '@/lib/supabase/server';

export interface RouteAssignmentData {
  vehicleRegistration: string;
  routeId: string;
  customers: Array<{
    id: string;
    customer: string;
    code: string;
    avg_seconds: number | null;
    avg_minutes: number | null;
  }>;
}

export async function assignRouteToVehicle(assignmentData: RouteAssignmentData) {
  try {
    const supabase = await createClient();
    
    // Start a transaction-like operation
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id')
      .eq('registration_no', assignmentData.vehicleRegistration)
      .single();

    if (vehicleError || !vehicle) {
      console.error('Error finding vehicle:', vehicleError);
      return { 
        success: false, 
        error: `Vehicle with registration ${assignmentData.vehicleRegistration} not found` 
      };
    }

    // Get route information
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('*')
      .eq('id', assignmentData.routeId)
      .single();

    if (routeError || !route) {
      console.error('Error finding route:', routeError);
      return { 
        success: false, 
        error: `Route with ID ${assignmentData.routeId} not found` 
      };
    }

    // Get the current user ID
    const { data: { user } } = await supabase.auth.getUser();
    
    // Create route assignment record
    const { data: assignment, error: assignmentError } = await supabase
      .from('assigned_routes')
      .insert({
        vehicle_id: vehicle.id,
        route_id: assignmentData.routeId,
        assigned_at: new Date().toISOString(),
        status: 'active',
        assigned_by: user?.id || null // Use actual user ID or null
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating route assignment:', assignmentError);
      return { 
        success: false, 
        error: 'Failed to create route assignment' 
      };
    }

    // Get customer coordinates from customers_location table
    console.log('🔍 Fetching coordinates for customers:', assignmentData.customers.map(c => c.code));
    
    const customerCoordinates = await Promise.all(
      assignmentData.customers.map(async (customer) => {
        try {
          console.log(`📍 Looking up coordinates for customer code: ${customer.code}`);
          
          const { data: locationData, error: locationError } = await supabase
            .from('customers_location')
            .select('lat, lon, direction')
            .eq('code', customer.code)
            .single();

          if (locationError) {
            console.warn(`❌ No coordinates found for customer ${customer.code}:`, locationError.message);
            return {
              latitude: null,
              longitude: null,
              direction: null
            };
          }

          if (!locationData) {
            console.warn(`❌ No location data returned for customer ${customer.code}`);
            return {
              latitude: null,
              longitude: null,
              direction: null
            };
          }

          const latitude = locationData.lat && Array.isArray(locationData.lat) && locationData.lat.length > 0 
            ? parseFloat(locationData.lat[0]) 
            : null;
          
          const longitude = locationData.lon && Array.isArray(locationData.lon) && locationData.lon.length > 0 
            ? parseFloat(locationData.lon[0]) 
            : null;

          console.log(`✅ Coordinates found for ${customer.code}:`, { latitude, longitude, direction: locationData.direction });

          return {
            latitude,
            longitude,
            direction: locationData.direction
          };
        } catch (error) {
          console.error(`❌ Error getting coordinates for customer ${customer.code}:`, error);
          return {
            latitude: null,
            longitude: null,
            direction: null
          };
        }
      })
    );

    // Log coordinate summary
    const coordinatesFound = customerCoordinates.filter(coord => coord.latitude && coord.longitude).length;
    console.log(`📍 Coordinate summary: ${coordinatesFound}/${assignmentData.customers.length} customers have coordinates`);

    // Create customer assignments for each customer in the route
    const customerAssignments = assignmentData.customers.map((customer, index) => ({
      assigned_route_id: assignment.id,
      customer_stop_id: customer.id,
      vehicle_id: vehicle.id,
      route_id: assignmentData.routeId,
      sequence_order: index + 1,
      assigned_at: new Date().toISOString(),
      status: 'pending',
      estimated_duration_seconds: customer.avg_seconds,
      estimated_duration_minutes: customer.avg_minutes,
      customer_latitude: customerCoordinates[index].latitude,
      customer_longitude: customerCoordinates[index].longitude,
      customer_direction: customerCoordinates[index].direction
    }));

    const { error: customerAssignmentsError } = await supabase
      .from('assigned_route_customers')
      .insert(customerAssignments);

    if (customerAssignmentsError) {
      console.error('Error creating customer assignments:', customerAssignmentsError);
      return { 
        success: false, 
        error: 'Failed to create customer assignments' 
      };
    }

    // Log the route assignment event
    await addRouteEvent({
      assignedRouteId: assignment.id,
      vehicleId: vehicle.id,
      eventType: 'route_assigned',
      eventCategory: 'assignment',
      eventDescription: `Route ${route.Route} assigned to vehicle ${assignmentData.vehicleRegistration}`,
      eventData: {
        routeName: route.Route,
        locationCode: route.LocationCode,
        customerCount: customerAssignments.length
      },
      severity: 'info'
    });

    console.log(`✅ Successfully assigned route ${assignmentData.routeId} to vehicle ${assignmentData.vehicleRegistration}`);
    console.log(`✅ Created ${customerAssignments.length} customer assignments`);

    return {
      success: true,
      data: {
        assignmentId: assignment.id,
        vehicleId: vehicle.id,
        routeId: assignmentData.routeId,
        customerAssignmentsCount: customerAssignments.length
      },
      error: null
    };

  } catch (error) {
    console.error('Unexpected error in assignRouteToVehicle:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred while assigning the route' 
    };
  }
}

export async function getRouteAssignments(vehicleRegistration?: string) {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('assigned_routes')
      .select(`
        *,
        vehicles!inner(registration_no, fleet_no),
        routes!inner(Route, LocationCode, ServiceDays),
        assigned_route_customers(
          *,
          customer_stops!inner(customer, code, avg_seconds, avg_minutes)
        )
      `)
      .eq('status', 'active');

    if (vehicleRegistration) {
      query = query.eq('vehicles.registration_no', vehicleRegistration);
    }

    const { data: assignments, error } = await query.order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching route assignments:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: assignments, error: null };
  } catch (error) {
    console.error('Unexpected error in getRouteAssignments:', error);
    return { success: false, error: 'An unexpected error occurred', data: null };
  }
}

// Function to add tracking data for a route assignment
export async function addRouteTracking(trackingData: {
  assignedRouteId: number;
  vehicleId: number;
  latitude?: number;
  longitude?: number;
  speed?: number;
  heading?: number;
  status?: string;
  eventType?: string;
  eventDescription?: string;
}) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('assigned_route_tracking')
      .insert({
        assigned_route_id: trackingData.assignedRouteId,
        vehicle_id: trackingData.vehicleId,
        latitude: trackingData.latitude,
        longitude: trackingData.longitude,
        speed: trackingData.speed,
        heading: trackingData.heading,
        status: trackingData.status || 'tracking',
        event_type: trackingData.eventType || 'location_update',
        event_description: trackingData.eventDescription
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding route tracking:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error in addRouteTracking:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Function to add events for a route assignment
export async function addRouteEvent(eventData: {
  assignedRouteId: number;
  customerAssignmentId?: number;
  vehicleId: number;
  eventType: string;
  eventCategory?: string;
  eventDescription?: string;
  eventData?: any;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  locationLatitude?: number;
  locationLongitude?: number;
  locationAddress?: string;
}) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('assigned_route_events')
      .insert({
        assigned_route_id: eventData.assignedRouteId,
        customer_assignment_id: eventData.customerAssignmentId,
        vehicle_id: eventData.vehicleId,
        event_type: eventData.eventType,
        event_category: eventData.eventCategory || 'general',
        event_description: eventData.eventDescription,
        event_data: eventData.eventData || {},
        severity: eventData.severity || 'info',
        location_latitude: eventData.locationLatitude,
        location_longitude: eventData.locationLongitude,
        location_address: eventData.locationAddress
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding route event:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error in addRouteEvent:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Function to update customer assignment status
export async function updateCustomerAssignmentStatus(
  customerAssignmentId: number,
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed',
  actualArrivalTime?: string,
  actualDepartureTime?: string,
  actualDurationMinutes?: number,
  serviceNotes?: string
) {
  try {
    const supabase = await createClient();
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (actualArrivalTime) updateData.actual_arrival_time = actualArrivalTime;
    if (actualDepartureTime) updateData.actual_departure_time = actualDepartureTime;
    if (actualDurationMinutes) updateData.actual_duration_minutes = actualDurationMinutes;
    if (serviceNotes) updateData.service_notes = serviceNotes;
    if (status === 'completed') updateData.completed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('assigned_route_customers')
      .update(updateData)
      .eq('id', customerAssignmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer assignment:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error in updateCustomerAssignmentStatus:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Function to get route assignment details with tracking and events
export async function getRouteAssignmentDetails(assignedRouteId: number) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('assigned_routes')
      .select(`
        *,
        vehicles!inner(registration_no, fleet_no, manufacturer),
        routes!inner(Route, LocationCode, ServiceDays),
        assigned_route_customers(
          *,
          customer_stops!inner(customer, code, avg_seconds, avg_minutes)
        ),
        assigned_route_tracking(
          *
        ),
        assigned_route_events(
          *
        )
      `)
      .eq('id', assignedRouteId)
      .single();

    if (error) {
      console.error('Error fetching route assignment details:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Unexpected error in getRouteAssignmentDetails:', error);
    return { success: false, error: 'An unexpected error occurred', data: null };
  }
}

// Function to get available routes (not already assigned)
export async function getAvailableRoutes() {
  try {
    const supabase = await createClient();
    
    // Get all routes
    const { data: allRoutes, error: routesError } = await supabase
      .from('routes')
      .select('*')
      .eq('Inactive', false); // Only active routes

    if (routesError) {
      console.error('Error fetching routes:', routesError);
      return { success: false, error: routesError.message, data: null };
    }

    // Get all active route assignments
    const { data: assignedRoutes, error: assignmentsError } = await supabase
      .from('assigned_routes')
      .select('route_id')
      .eq('status', 'active');

    if (assignmentsError) {
      console.error('Error fetching assigned routes:', assignmentsError);
      return { success: false, error: assignmentsError.message, data: null };
    }

    // Filter out already assigned routes
    const assignedRouteIds = new Set(assignedRoutes.map(ar => ar.route_id));
    const availableRoutes = allRoutes.filter(route => !assignedRouteIds.has(route.id));

    return { success: true, data: availableRoutes, error: null };
  } catch (error) {
    console.error('Unexpected error in getAvailableRoutes:', error);
    return { success: false, error: 'An unexpected error occurred', data: null };
  }
}

// Function to check if a specific route is available
export async function isRouteAvailable(routeId: number) {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('assigned_routes')
      .select('id')
      .eq('route_id', routeId)
      .eq('status', 'active')
      .single();

    // If no record found, route is available
    if (error && error.code === 'PGRST116') {
      return { success: true, data: { available: true }, error: null };
    }

    if (error) {
      console.error('Error checking route availability:', error);
      return { success: false, error: error.message, data: null };
    }

    // If record found, route is not available
    return { success: true, data: { available: false, assignmentId: data.id }, error: null };
  } catch (error) {
    console.error('Unexpected error in isRouteAvailable:', error);
    return { success: false, error: 'An unexpected error occurred', data: null };
  }
}

// Function to get assigned routes with details
export async function getAssignedRoutes() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('assigned_routes')
      .select(`
        *,
        vehicles!inner(registration_no, fleet_no, manufacturer),
        routes!inner(Route, LocationCode, ServiceDays),
        assigned_route_customers(
          id,
          status,
          sequence_order,
          customer_stops!inner(customer, code)
        )
      `)
      .eq('status', 'active')
      .order('assigned_at', { ascending: false });

    if (error) {
      console.error('Error fetching assigned routes:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Unexpected error in getAssignedRoutes:', error);
    return { success: false, error: 'An unexpected error occurred', data: null };
  }
}

// Function to check if a vehicle has an assigned route for a specific day
export async function getVehicleRouteAssignmentForDay(vehicleRegistration: string, day: string) {
  try {
    const supabase = await createClient();
    
    // Get current date
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data, error } = await supabase
      .from('assigned_routes')
      .select(`
        *,
        vehicles!inner(registration_no),
        routes!inner(Route, LocationCode, ServiceDays),
        assigned_route_customers(
          id,
          status,
          sequence_order,
          estimated_duration_minutes,
          estimated_arrival_time,
          customer_stops!inner(customer, code, avg_seconds, avg_minutes)
        )
      `)
      .eq('vehicles.registration_no', vehicleRegistration)
      .eq('status', 'active')
      .gte('assigned_at', `${todayString}T00:00:00`)
      .lt('assigned_at', `${todayString}T23:59:59`)
      .single();

    // If no assignment found for today, return null
    if (error && error.code === 'PGRST116') {
      return { success: true, data: null, error: null };
    }

    if (error) {
      console.error('Error checking vehicle route assignment:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Unexpected error in getVehicleRouteAssignmentForDay:', error);
    return { success: false, error: 'An unexpected error occurred', data: null };
  }
}

// Function to get assigned customers with coordinates for a vehicle
export async function getVehicleAssignedCustomersWithCoordinates(vehicleRegistration: string) {
  try {
    const supabase = await createClient();
    
    // Get current date
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const { data, error } = await supabase
      .from('assigned_routes')
      .select(`
        *,
        vehicles!inner(registration_no),
        routes!inner(Route, LocationCode, ServiceDays),
        assigned_route_customers(
          id,
          status,
          sequence_order,
          estimated_duration_minutes,
          estimated_arrival_time,
          customer_latitude,
          customer_longitude,
          customer_direction,
          customer_stops!inner(customer, code, avg_seconds, avg_minutes)
        )
      `)
      .eq('vehicles.registration_no', vehicleRegistration)
      .eq('status', 'active')
      .gte('assigned_at', `${todayString}T00:00:00`)
      .lt('assigned_at', `${todayString}T23:59:59`)
      .single();

    // If no assignment found for today, return null
    if (error && error.code === 'PGRST116') {
      return { success: true, data: null, error: null };
    }

    if (error) {
      console.error('Error fetching vehicle assigned customers:', error);
      return { success: false, error: error.message, data: null };
    }

    // Process the data to include customer coordinates and calculate distances
    if (data && data.assigned_route_customers) {
      const processedCustomers = data.assigned_route_customers
        .filter((customer: any) => 
          customer.customer_latitude && 
          customer.customer_longitude &&
          customer.customer_stops
        )
        .map((customer: any) => ({
          id: customer.id,
          customerName: customer.customer_stops.customer,
          customerCode: customer.customer_stops.code,
          sequenceOrder: customer.sequence_order,
          status: customer.status,
          estimatedArrivalTime: customer.estimated_arrival_time,
          estimatedDurationMinutes: customer.estimated_duration_minutes,
          coordinates: {
            latitude: customer.customer_latitude,
            longitude: customer.customer_longitude
          },
          direction: customer.customer_direction,
          avgSeconds: customer.customer_stops.avg_seconds,
          avgMinutes: customer.customer_stops.avg_minutes
        }));

      return { 
        success: true, 
        data: {
          ...data,
          assigned_route_customers: processedCustomers
        }, 
        error: null 
      };
    }

    return { success: true, data, error: null };
  } catch (error) {
    console.error('Unexpected error in getVehicleAssignedCustomersWithCoordinates:', error);
    return { success: false, error: 'An unexpected error occurred', data: null };
  }
}