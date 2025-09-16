-- =====================================================
-- DELIVERY MONITORING SYSTEM
-- =====================================================
-- This schema tracks vehicle stops and automatically marks deliveries as completed
-- when a vehicle stops for more than 10 minutes within 200m of a customer

-- =====================================================
-- 1. VEHICLE STOP TRACKING TABLE
-- =====================================================

-- Table to track vehicle stops and their duration
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
-- 2. DELIVERY COMPLETION TRACKING TABLE
-- =====================================================

-- Table to track completed deliveries based on stop monitoring
CREATE TABLE IF NOT EXISTS delivery_completions (
  id SERIAL PRIMARY KEY,
  vehicle_registration TEXT NOT NULL,
  customer_id INTEGER NOT NULL,
  customer_code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  stop_id INTEGER REFERENCES vehicle_stops(id),
  completion_time TIMESTAMP WITH TIME ZONE NOT NULL,
  stop_duration_minutes INTEGER NOT NULL,
  distance_from_customer_meters DECIMAL(8, 2),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  delivery_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CUSTOMER DELIVERY STATUS TABLE
-- =====================================================

-- Table to track daily delivery status for each customer
CREATE TABLE IF NOT EXISTS customer_delivery_status (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  customer_code TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  vehicle_registration TEXT,
  delivery_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  assigned_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  stop_duration_minutes INTEGER,
  distance_from_customer_meters DECIMAL(8, 2),
  completion_latitude DECIMAL(10, 8),
  completion_longitude DECIMAL(11, 8),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per customer per day
  UNIQUE(customer_id, delivery_date)
);

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Indexes for vehicle_stops table
CREATE INDEX IF NOT EXISTS idx_vehicle_stops_registration ON vehicle_stops(vehicle_registration);
CREATE INDEX IF NOT EXISTS idx_vehicle_stops_start_time ON vehicle_stops(stop_start_time);
CREATE INDEX IF NOT EXISTS idx_vehicle_stops_active ON vehicle_stops(is_active);
CREATE INDEX IF NOT EXISTS idx_vehicle_stops_location ON vehicle_stops(latitude, longitude);

-- Indexes for delivery_completions table
CREATE INDEX IF NOT EXISTS idx_delivery_completions_vehicle ON delivery_completions(vehicle_registration);
CREATE INDEX IF NOT EXISTS idx_delivery_completions_customer ON delivery_completions(customer_id);
CREATE INDEX IF NOT EXISTS idx_delivery_completions_date ON delivery_completions(delivery_date);
CREATE INDEX IF NOT EXISTS idx_delivery_completions_time ON delivery_completions(completion_time);

-- Indexes for customer_delivery_status table
CREATE INDEX IF NOT EXISTS idx_customer_delivery_status_customer ON customer_delivery_status(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_delivery_status_date ON customer_delivery_status(delivery_date);
CREATE INDEX IF NOT EXISTS idx_customer_delivery_status_vehicle ON customer_delivery_status(vehicle_registration);
CREATE INDEX IF NOT EXISTS idx_customer_delivery_status_status ON customer_delivery_status(status);

-- =====================================================
-- 5. HELPER FUNCTIONS
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
-- 6. AUTOMATIC DELIVERY COMPLETION TRIGGER
-- =====================================================

-- Function to automatically mark deliveries as completed
CREATE OR REPLACE FUNCTION check_delivery_completion()
RETURNS TRIGGER AS $$
DECLARE
  customer_record RECORD;
  distance_meters DECIMAL(8, 2);
  stop_duration INTEGER;
BEGIN
  -- Only process when stop is marked as ended (stop_end_time is set)
  IF NEW.stop_end_time IS NOT NULL AND OLD.stop_end_time IS NULL THEN
    -- Calculate stop duration in minutes
    stop_duration := EXTRACT(EPOCH FROM (NEW.stop_end_time - NEW.stop_start_time)) / 60;
    
    -- Only process stops longer than 10 minutes
    IF stop_duration >= 10 THEN
      -- Find customers within 200m radius
      FOR customer_record IN
        SELECT 
          cs.id as customer_id,
          cs.code as customer_code,
          cs.customer as customer_name,
          cl.lat as customer_lat,
          cl.lon as customer_lon
        FROM customer_stops cs
        JOIN customers_location cl ON cs.code = cl.code
        WHERE 
          cl.lat IS NOT NULL 
          AND cl.lon IS NOT NULL
          AND is_within_radius(
            NEW.latitude, 
            NEW.longitude, 
            cl.lat, 
            cl.lon, 
            200
          )
      LOOP
        -- Calculate exact distance
        distance_meters := calculate_distance_meters(
          NEW.latitude, 
          NEW.longitude, 
          customer_record.customer_lat, 
          customer_record.customer_lon
        );
        
        -- Insert delivery completion record
        INSERT INTO delivery_completions (
          vehicle_registration,
          customer_id,
          customer_code,
          customer_name,
          stop_id,
          completion_time,
          stop_duration_minutes,
          distance_from_customer_meters,
          latitude,
          longitude,
          delivery_date
        ) VALUES (
          NEW.vehicle_registration,
          customer_record.customer_id,
          customer_record.customer_code,
          customer_record.customer_name,
          NEW.id,
          NEW.stop_end_time,
          stop_duration,
          distance_meters,
          NEW.latitude,
          NEW.longitude,
          CURRENT_DATE
        );
        
        -- Update customer delivery status
        INSERT INTO customer_delivery_status (
          customer_id,
          customer_code,
          customer_name,
          vehicle_registration,
          delivery_date,
          status,
          completed_at,
          stop_duration_minutes,
          distance_from_customer_meters,
          completion_latitude,
          completion_longitude
        ) VALUES (
          customer_record.customer_id,
          customer_record.customer_code,
          customer_record.customer_name,
          NEW.vehicle_registration,
          CURRENT_DATE,
          'completed',
          NEW.stop_end_time,
          stop_duration,
          distance_meters,
          NEW.latitude,
          NEW.longitude
        )
        ON CONFLICT (customer_id, delivery_date) 
        DO UPDATE SET
          status = 'completed',
          completed_at = NEW.stop_end_time,
          stop_duration_minutes = stop_duration,
          distance_from_customer_meters = distance_meters,
          completion_latitude = NEW.latitude,
          completion_longitude = NEW.longitude,
          updated_at = NOW();
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
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE vehicle_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_delivery_status ENABLE ROW LEVEL SECURITY;

-- Policies for vehicle_stops
CREATE POLICY "Users can view vehicle stops" ON vehicle_stops
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vehicle stops" ON vehicle_stops
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update vehicle stops" ON vehicle_stops
  FOR UPDATE USING (true);

-- Policies for delivery_completions
CREATE POLICY "Users can view delivery completions" ON delivery_completions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert delivery completions" ON delivery_completions
  FOR INSERT WITH CHECK (true);

-- Policies for customer_delivery_status
CREATE POLICY "Users can view customer delivery status" ON customer_delivery_status
  FOR SELECT USING (true);

CREATE POLICY "Users can insert customer delivery status" ON customer_delivery_status
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update customer delivery status" ON customer_delivery_status
  FOR UPDATE USING (true);

-- =====================================================
-- 8. USEFUL QUERIES
-- =====================================================

-- Query to get current active stops
-- SELECT * FROM vehicle_stops WHERE is_active = true;

-- Query to get completed deliveries for today
-- SELECT * FROM delivery_completions WHERE delivery_date = CURRENT_DATE;

-- Query to get customer delivery status for today
-- SELECT * FROM customer_delivery_status WHERE delivery_date = CURRENT_DATE;

-- Query to get pending deliveries for a vehicle
-- SELECT * FROM customer_delivery_status 
-- WHERE vehicle_registration = 'VEHICLE_PLATE' 
-- AND delivery_date = CURRENT_DATE 
-- AND status = 'pending';

-- Query to get completed deliveries for a vehicle
-- SELECT * FROM customer_delivery_status 
-- WHERE vehicle_registration = 'VEHICLE_PLATE' 
-- AND delivery_date = CURRENT_DATE 
-- AND status = 'completed';
