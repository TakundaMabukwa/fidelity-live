-- =====================================================
-- ADD COORDINATES TO ASSIGNED ROUTES TABLES
-- =====================================================
-- This file adds coordinate fields to store customer location data
-- from the customers_location table when assigning routes

-- =====================================================
-- 1. ADD COORDINATE FIELDS TO ASSIGNED_ROUTE_CUSTOMERS
-- =====================================================

-- Add latitude and longitude fields to store customer coordinates
ALTER TABLE assigned_route_customers 
ADD COLUMN IF NOT EXISTS customer_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS customer_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS customer_direction TEXT,
ADD COLUMN IF NOT EXISTS customer_address TEXT;

-- Add indexes for coordinate-based queries
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_coordinates 
ON assigned_route_customers(customer_latitude, customer_longitude);

-- =====================================================
-- 2. ADD COORDINATE FIELDS TO ASSIGNED_ROUTE_TRACKING
-- =====================================================

-- Add more detailed coordinate fields for tracking
ALTER TABLE assigned_route_tracking 
ADD COLUMN IF NOT EXISTS accuracy_meters DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS altitude_meters DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS bearing_degrees DECIMAL(5, 2);

-- =====================================================
-- 3. ADD COORDINATE FIELDS TO ASSIGNED_ROUTE_EVENTS
-- =====================================================

-- Add coordinate fields for event locations
ALTER TABLE assigned_route_events 
ADD COLUMN IF NOT EXISTS event_accuracy DECIMAL(8, 2),
ADD COLUMN IF NOT EXISTS event_altitude DECIMAL(8, 2);

-- =====================================================
-- 4. UPDATE ROUTE ASSIGNMENT FUNCTION TO INCLUDE COORDINATES
-- =====================================================

-- Create a function to get customer coordinates from customers_location table
CREATE OR REPLACE FUNCTION get_customer_coordinates(customer_code TEXT)
RETURNS TABLE(
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    direction TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN cl.lat IS NOT NULL AND array_length(cl.lat, 1) > 0 
            THEN cl.lat[1]::DECIMAL(10, 8)
            ELSE NULL 
        END as latitude,
        CASE 
            WHEN cl.lon IS NOT NULL AND array_length(cl.lon, 1) > 0 
            THEN cl.lon[1]::DECIMAL(11, 8)
            ELSE NULL 
        END as longitude,
        cl.direction
    FROM customers_location cl
    WHERE cl.code = customer_code
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. SAMPLE QUERIES FOR COORDINATE OPERATIONS
-- =====================================================

/*
-- Query to get all assigned customers with their coordinates
SELECT 
    arc.id,
    arc.sequence_order,
    cs.customer,
    cs.code,
    arc.customer_latitude,
    arc.customer_longitude,
    arc.customer_direction,
    arc.status,
    arc.estimated_arrival_time
FROM assigned_route_customers arc
JOIN customer_stops cs ON arc.customer_stop_id = cs.id
WHERE arc.assigned_route_id = 123
ORDER BY arc.sequence_order;

-- Query to update customer coordinates from customers_location table
UPDATE assigned_route_customers 
SET 
    customer_latitude = cl.lat[1]::DECIMAL(10, 8),
    customer_longitude = cl.lon[1]::DECIMAL(11, 8),
    customer_direction = cl.direction
FROM customers_location cl
WHERE assigned_route_customers.customer_stop_id IN (
    SELECT cs.id 
    FROM customer_stops cs 
    WHERE cs.code = cl.code
)
AND cl.lat IS NOT NULL 
AND cl.lon IS NOT NULL 
AND array_length(cl.lat, 1) > 0 
AND array_length(cl.lon, 1) > 0;

-- Query to get customers within a certain radius of a point
SELECT 
    arc.id,
    cs.customer,
    cs.code,
    arc.customer_latitude,
    arc.customer_longitude,
    -- Calculate distance using Haversine formula (simplified)
    (6371 * acos(
        cos(radians(arc.customer_latitude)) * 
        cos(radians(40.7128)) * 
        cos(radians(-74.0060) - radians(arc.customer_longitude)) + 
        sin(radians(arc.customer_latitude)) * 
        sin(radians(40.7128))
    )) AS distance_km
FROM assigned_route_customers arc
JOIN customer_stops cs ON arc.customer_stop_id = cs.id
WHERE arc.customer_latitude IS NOT NULL 
AND arc.customer_longitude IS NOT NULL
AND arc.assigned_route_id = 123
ORDER BY distance_km;

-- Query to get route assignment with all customer coordinates
SELECT 
    ar.id as assignment_id,
    v.registration_no,
    r.Route,
    r.LocationCode,
    json_agg(
        json_build_object(
            'customer_id', arc.id,
            'customer_name', cs.customer,
            'customer_code', cs.code,
            'sequence_order', arc.sequence_order,
            'latitude', arc.customer_latitude,
            'longitude', arc.customer_longitude,
            'direction', arc.customer_direction,
            'status', arc.status,
            'estimated_arrival', arc.estimated_arrival_time
        ) ORDER BY arc.sequence_order
    ) as customers_with_coordinates
FROM assigned_routes ar
JOIN vehicles v ON ar.vehicle_id = v.id
JOIN routes r ON ar.route_id = r.id
LEFT JOIN assigned_route_customers arc ON ar.id = arc.assigned_route_id
LEFT JOIN customer_stops cs ON arc.customer_stop_id = cs.id
WHERE ar.id = 123
GROUP BY ar.id, v.registration_no, r.Route, r.LocationCode;
*/

-- =====================================================
-- 6. TRIGGER TO AUTO-UPDATE COORDINATES
-- =====================================================

-- Create a trigger function to automatically update coordinates when customer is assigned
CREATE OR REPLACE FUNCTION update_customer_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    -- Get coordinates from customers_location table
    UPDATE assigned_route_customers 
    SET 
        customer_latitude = cl.lat[1]::DECIMAL(10, 8),
        customer_longitude = cl.lon[1]::DECIMAL(11, 8),
        customer_direction = cl.direction
    FROM customers_location cl
    JOIN customer_stops cs ON cs.id = NEW.customer_stop_id
    WHERE assigned_route_customers.id = NEW.id
    AND cl.code = cs.code
    AND cl.lat IS NOT NULL 
    AND cl.lon IS NOT NULL 
    AND array_length(cl.lat, 1) > 0 
    AND array_length(cl.lon, 1) > 0;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_customer_coordinates ON assigned_route_customers;
CREATE TRIGGER trigger_update_customer_coordinates
    AFTER INSERT ON assigned_route_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_coordinates();

-- =====================================================
-- END OF COORDINATE ENHANCEMENTS
-- =====================================================
