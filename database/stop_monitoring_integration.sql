-- =====================================================
-- STOP MONITORING INTEGRATION WITH EXISTING TABLES
-- =====================================================
-- This adds stop monitoring capabilities to your existing assigned_route_customers table

-- =====================================================
-- 1. ADD STOP MONITORING COLUMNS TO EXISTING TABLE
-- =====================================================

-- Add columns to track stop monitoring for each customer assignment
ALTER TABLE assigned_route_customers 
ADD COLUMN IF NOT EXISTS customer_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS customer_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS stop_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stop_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stop_duration_minutes INTEGER,
ADD COLUMN IF NOT EXISTS distance_from_customer_meters DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS delivery_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_completed BOOLEAN DEFAULT FALSE;

-- =====================================================
-- 2. CREATE VEHICLE STOPS TRACKING TABLE
-- =====================================================

-- Simple table to track vehicle stops (separate from customer assignments)
CREATE TABLE IF NOT EXISTS vehicle_stops (
  id SERIAL PRIMARY KEY,
  vehicle_registration TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  stop_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  stop_end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate distance between two coordinates (Haversine formula)
CREATE OR REPLACE FUNCTION calculate_distance_meters(
  lat1 DECIMAL(10, 8),
  lon1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lon2 DECIMAL(11, 8)
) RETURNS DECIMAL(8, 2) AS $$
DECLARE
  earth_radius DECIMAL := 6371000; -- Earth radius in meters
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
  distance DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  
  a := sin(dlat/2) * sin(dlat/2) + 
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dlon/2) * sin(dlon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  distance := earth_radius * c;
  
  RETURN distance;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a vehicle is within radius of a customer
CREATE OR REPLACE FUNCTION is_within_radius(
  vehicle_lat DECIMAL(10, 8),
  vehicle_lon DECIMAL(11, 8),
  customer_lat DECIMAL(10, 8),
  customer_lon DECIMAL(11, 8),
  radius_meters INTEGER DEFAULT 200
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN calculate_distance_meters(vehicle_lat, vehicle_lon, customer_lat, customer_lon) <= radius_meters;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. AUTOMATIC DELIVERY COMPLETION TRIGGER
-- =====================================================

-- Function to automatically mark deliveries as completed when vehicle stops for 10+ minutes near customer
CREATE OR REPLACE FUNCTION check_delivery_completion()
RETURNS TRIGGER AS $$
DECLARE
  customer_assignment RECORD;
  distance_meters DECIMAL(8, 2);
  stop_duration INTEGER;
BEGIN
  -- Only process when stop is marked as ended (stop_end_time is set)
  IF NEW.stop_end_time IS NOT NULL AND OLD.stop_end_time IS NULL THEN
    -- Calculate stop duration in minutes
    stop_duration := EXTRACT(EPOCH FROM (NEW.stop_end_time - NEW.stop_start_time)) / 60;
    
    -- Only process stops longer than 10 minutes
    IF stop_duration >= 10 THEN
      -- Find customer assignments within 200m radius that are still pending
      FOR customer_assignment IN
        SELECT 
          arc.id,
          arc.assigned_route_id,
          arc.customer_stop_id,
          arc.status,
          arc.customer_latitude,
          arc.customer_longitude,
          cs.customer,
          cs.code
        FROM assigned_route_customers arc
        JOIN customer_stops cs ON arc.customer_stop_id = cs.id
        JOIN assigned_routes ar ON arc.assigned_route_id = ar.id
        JOIN vehicles v ON ar.vehicle_id = v.id
        WHERE 
          v.registration_no = NEW.vehicle_registration
          AND arc.status IN ('pending', 'in_progress')
          AND arc.customer_latitude IS NOT NULL 
          AND arc.customer_longitude IS NOT NULL
          AND is_within_radius(
            NEW.latitude, 
            NEW.longitude, 
            arc.customer_latitude, 
            arc.customer_longitude, 
            200
          )
      LOOP
        -- Calculate exact distance
        distance_meters := calculate_distance_meters(
          NEW.latitude, 
          NEW.longitude, 
          customer_assignment.customer_latitude, 
          customer_assignment.customer_longitude
        );
        
        -- Update customer assignment to completed
        UPDATE assigned_route_customers 
        SET 
          status = 'completed',
          stop_start_time = NEW.stop_start_time,
          stop_end_time = NEW.stop_end_time,
          stop_duration_minutes = stop_duration,
          distance_from_customer_meters = distance_meters,
          delivery_completed_at = NEW.stop_end_time,
          auto_completed = TRUE,
          actual_arrival_time = NEW.stop_start_time,
          actual_departure_time = NEW.stop_end_time,
          updated_at = NOW()
        WHERE id = customer_assignment.id;
        
        -- Log the completion event
        INSERT INTO assigned_route_events (
          assigned_route_id,
          customer_assignment_id,
          vehicle_id,
          event_type,
          event_category,
          event_description,
          event_data,
          severity,
          location_latitude,
          location_longitude,
          recorded_at
        ) 
        SELECT 
          customer_assignment.assigned_route_id,
          customer_assignment.id,
          v.id,
          'delivery_completed',
          'delivery',
          'Delivery automatically completed - vehicle stopped for ' || stop_duration || ' minutes within 200m of customer',
          jsonb_build_object(
            'stop_duration_minutes', stop_duration,
            'distance_meters', distance_meters,
            'auto_completed', true,
            'customer_name', customer_assignment.customer,
            'customer_code', customer_assignment.code
          ),
          'info',
          NEW.latitude,
          NEW.longitude,
          NEW.stop_end_time
        FROM vehicles v
        JOIN assigned_routes ar ON v.id = ar.vehicle_id
        WHERE ar.id = customer_assignment.assigned_route_id;
        
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic delivery completion
DROP TRIGGER IF EXISTS trigger_check_delivery_completion ON vehicle_stops;
CREATE TRIGGER trigger_check_delivery_completion
  AFTER UPDATE ON vehicle_stops
  FOR EACH ROW
  EXECUTE FUNCTION check_delivery_completion();

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for vehicle_stops table
CREATE INDEX IF NOT EXISTS idx_vehicle_stops_registration ON vehicle_stops(vehicle_registration);
CREATE INDEX IF NOT EXISTS idx_vehicle_stops_start_time ON vehicle_stops(stop_start_time);
CREATE INDEX IF NOT EXISTS idx_vehicle_stops_active ON vehicle_stops(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicle_stops_location ON vehicle_stops(latitude, longitude);

-- Indexes for new columns in assigned_route_customers
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_customer_location ON assigned_route_customers(customer_latitude, customer_longitude);
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_auto_completed ON assigned_route_customers(auto_completed);
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_delivery_completed ON assigned_route_customers(delivery_completed_at);

-- =====================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on vehicle_stops table
ALTER TABLE vehicle_stops ENABLE ROW LEVEL SECURITY;

-- Policies for vehicle_stops
CREATE POLICY "Users can view vehicle stops" ON vehicle_stops
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vehicle stops" ON vehicle_stops
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update vehicle stops" ON vehicle_stops
  FOR UPDATE USING (true);

-- =====================================================
-- 7. USEFUL QUERIES FOR MONITORING
-- =====================================================

/*
-- Query to get customer assignments with stop monitoring data
SELECT 
    arc.id,
    arc.sequence_order,
    cs.customer,
    cs.code,
    v.registration_no,
    arc.status,
    arc.customer_latitude,
    arc.customer_longitude,
    arc.stop_start_time,
    arc.stop_end_time,
    arc.stop_duration_minutes,
    arc.distance_from_customer_meters,
    arc.delivery_completed_at,
    arc.auto_completed,
    arc.estimated_arrival_time,
    arc.actual_arrival_time
FROM assigned_route_customers arc
JOIN customer_stops cs ON arc.customer_stop_id = cs.id
JOIN assigned_routes ar ON arc.assigned_route_id = ar.id
JOIN vehicles v ON ar.vehicle_id = v.id
WHERE ar.status = 'active'
ORDER BY v.registration_no, arc.sequence_order;

-- Query to get auto-completed deliveries for today
SELECT 
    v.registration_no,
    cs.customer,
    cs.code,
    arc.delivery_completed_at,
    arc.stop_duration_minutes,
    arc.distance_from_customer_meters
FROM assigned_route_customers arc
JOIN customer_stops cs ON arc.customer_stop_id = cs.id
JOIN assigned_routes ar ON arc.assigned_route_id = ar.id
JOIN vehicles v ON ar.vehicle_id = v.id
WHERE arc.auto_completed = TRUE
AND DATE(arc.delivery_completed_at) = CURRENT_DATE
ORDER BY arc.delivery_completed_at DESC;

-- Query to get pending deliveries for a vehicle
SELECT 
    arc.id,
    arc.sequence_order,
    cs.customer,
    cs.code,
    arc.customer_latitude,
    arc.customer_longitude,
    arc.estimated_arrival_time
FROM assigned_route_customers arc
JOIN customer_stops cs ON arc.customer_stop_id = cs.id
JOIN assigned_routes ar ON arc.assigned_route_id = ar.id
JOIN vehicles v ON ar.vehicle_id = v.id
WHERE v.registration_no = 'VEHICLE_PLATE'
AND ar.status = 'active'
AND arc.status IN ('pending', 'in_progress')
ORDER BY arc.sequence_order;

-- Query to get delivery statistics for a vehicle today
SELECT 
    v.registration_no,
    COUNT(*) as total_customers,
    COUNT(CASE WHEN arc.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN arc.status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN arc.auto_completed = TRUE THEN 1 END) as auto_completed,
    ROUND(COUNT(CASE WHEN arc.status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as completion_rate
FROM assigned_route_customers arc
JOIN assigned_routes ar ON arc.assigned_route_id = ar.id
JOIN vehicles v ON ar.vehicle_id = v.id
WHERE ar.status = 'active'
AND DATE(ar.assigned_at) = CURRENT_DATE
GROUP BY v.registration_no;
*/
