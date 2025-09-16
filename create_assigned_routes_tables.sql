-- =====================================================
-- ASSIGNED ROUTES DATABASE SCHEMA
-- =====================================================
-- This file contains the complete SQL schema for storing assigned routes
-- with all related information including vehicles, routes, customers, and tracking data.

-- =====================================================
-- 1. MAIN ROUTE ASSIGNMENTS TABLE
-- =====================================================
-- This table stores the main route assignments to vehicles
CREATE TABLE IF NOT EXISTS assigned_routes (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID DEFAULT auth.uid(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'paused')),
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    estimated_start_time TIMESTAMP WITH TIME ZONE,
    estimated_end_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    total_estimated_duration_minutes INTEGER,
    total_actual_duration_minutes INTEGER,
    total_distance_km DECIMAL(10,2),
    fuel_consumed_liters DECIMAL(8,2),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CUSTOMER STOP ASSIGNMENTS TABLE
-- =====================================================
-- This table stores individual customer stop assignments within a route assignment
CREATE TABLE IF NOT EXISTS assigned_route_customers (
    id BIGSERIAL PRIMARY KEY,
    assigned_route_id BIGINT NOT NULL REFERENCES assigned_routes(id) ON DELETE CASCADE,
    customer_stop_id UUID NOT NULL REFERENCES customer_stops(id) ON DELETE CASCADE,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL DEFAULT 1,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
    estimated_duration_seconds INTEGER,
    estimated_duration_minutes INTEGER,
    actual_duration_seconds INTEGER,
    actual_duration_minutes INTEGER,
    estimated_arrival_time TIMESTAMP WITH TIME ZONE,
    actual_arrival_time TIMESTAMP WITH TIME ZONE,
    estimated_departure_time TIMESTAMP WITH TIME ZONE,
    actual_departure_time TIMESTAMP WITH TIME ZONE,
    service_type VARCHAR(50) DEFAULT 'standard',
    service_notes TEXT,
    collection_bags INTEGER DEFAULT 0,
    delivery_bags INTEGER DEFAULT 0,
    special_instructions TEXT,
    customer_feedback TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. ROUTE ASSIGNMENT TRACKING TABLE
-- =====================================================
-- This table stores real-time tracking and status updates for route assignments
CREATE TABLE IF NOT EXISTS assigned_route_tracking (
    id BIGSERIAL PRIMARY KEY,
    assigned_route_id BIGINT NOT NULL REFERENCES assigned_routes(id) ON DELETE CASCADE,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    speed DECIMAL(5, 2),
    heading DECIMAL(5, 2),
    altitude DECIMAL(8, 2),
    accuracy DECIMAL(8, 2),
    status VARCHAR(50) DEFAULT 'tracking',
    event_type VARCHAR(50) DEFAULT 'location_update',
    event_description TEXT,
    fuel_level DECIMAL(5, 2),
    engine_status VARCHAR(20) DEFAULT 'running',
    temperature DECIMAL(5, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ROUTE ASSIGNMENT EVENTS TABLE
-- =====================================================
-- This table stores important events and milestones during route execution
CREATE TABLE IF NOT EXISTS assigned_route_events (
    id BIGSERIAL PRIMARY KEY,
    assigned_route_id BIGINT NOT NULL REFERENCES assigned_routes(id) ON DELETE CASCADE,
    customer_assignment_id BIGINT REFERENCES assigned_route_customers(id) ON DELETE CASCADE,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_category VARCHAR(30) DEFAULT 'general',
    event_description TEXT,
    event_data JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    location_latitude DECIMAL(10, 8),
    location_longitude DECIMAL(11, 8),
    location_address TEXT,
    recorded_by UUID DEFAULT auth.uid(),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- =====================================================
-- 5. INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Assigned Routes Indexes
CREATE INDEX IF NOT EXISTS idx_assigned_routes_vehicle_id ON assigned_routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_assigned_routes_route_id ON assigned_routes(route_id);
CREATE INDEX IF NOT EXISTS idx_assigned_routes_status ON assigned_routes(status);
CREATE INDEX IF NOT EXISTS idx_assigned_routes_assigned_at ON assigned_routes(assigned_at);
CREATE INDEX IF NOT EXISTS idx_assigned_routes_assigned_by ON assigned_routes(assigned_by);
CREATE INDEX IF NOT EXISTS idx_assigned_routes_priority ON assigned_routes(priority);
CREATE INDEX IF NOT EXISTS idx_assigned_routes_estimated_start ON assigned_routes(estimated_start_time);

-- Assigned Route Customers Indexes
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_assigned_route_id ON assigned_route_customers(assigned_route_id);
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_customer_stop_id ON assigned_route_customers(customer_stop_id);
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_vehicle_id ON assigned_route_customers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_route_id ON assigned_route_customers(route_id);
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_status ON assigned_route_customers(status);
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_sequence ON assigned_route_customers(assigned_route_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_assigned_route_customers_estimated_arrival ON assigned_route_customers(estimated_arrival_time);

-- Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_assigned_route_tracking_assigned_route_id ON assigned_route_tracking(assigned_route_id);
CREATE INDEX IF NOT EXISTS idx_assigned_route_tracking_vehicle_id ON assigned_route_tracking(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_assigned_route_tracking_recorded_at ON assigned_route_tracking(recorded_at);
CREATE INDEX IF NOT EXISTS idx_assigned_route_tracking_status ON assigned_route_tracking(status);

-- Events Indexes
CREATE INDEX IF NOT EXISTS idx_assigned_route_events_assigned_route_id ON assigned_route_events(assigned_route_id);
CREATE INDEX IF NOT EXISTS idx_assigned_route_events_customer_assignment_id ON assigned_route_events(customer_assignment_id);
CREATE INDEX IF NOT EXISTS idx_assigned_route_events_vehicle_id ON assigned_route_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_assigned_route_events_event_type ON assigned_route_events(event_type);
CREATE INDEX IF NOT EXISTS idx_assigned_route_events_recorded_at ON assigned_route_events(recorded_at);
CREATE INDEX IF NOT EXISTS idx_assigned_route_events_severity ON assigned_route_events(severity);


-- =====================================================
-- 6. UNIQUE CONSTRAINTS
-- =====================================================

-- Prevent duplicate active route assignments for the same vehicle and route
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_assigned_route 
ON assigned_routes(vehicle_id, route_id) 
WHERE status = 'active';

-- Ensure unique sequence order per assigned route
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_customer_sequence 
ON assigned_route_customers(assigned_route_id, sequence_order);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE assigned_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_route_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_route_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_route_events ENABLE ROW LEVEL SECURITY;

-- Assigned Routes Policies
CREATE POLICY "Users can view assigned routes" ON assigned_routes
    FOR SELECT USING (true);

CREATE POLICY "Users can insert assigned routes" ON assigned_routes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update assigned routes" ON assigned_routes
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete assigned routes" ON assigned_routes
    FOR DELETE USING (true);

-- Assigned Route Customers Policies
CREATE POLICY "Users can view assigned route customers" ON assigned_route_customers
    FOR SELECT USING (true);

CREATE POLICY "Users can insert assigned route customers" ON assigned_route_customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update assigned route customers" ON assigned_route_customers
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete assigned route customers" ON assigned_route_customers
    FOR DELETE USING (true);

-- Tracking Policies
CREATE POLICY "Users can view route tracking" ON assigned_route_tracking
    FOR SELECT USING (true);

CREATE POLICY "Users can insert route tracking" ON assigned_route_tracking
    FOR INSERT WITH CHECK (true);

-- Events Policies
CREATE POLICY "Users can view route events" ON assigned_route_events
    FOR SELECT USING (true);

CREATE POLICY "Users can insert route events" ON assigned_route_events
    FOR INSERT WITH CHECK (true);


-- =====================================================
-- 8. TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_assigned_routes_updated_at 
    BEFORE UPDATE ON assigned_routes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assigned_route_customers_updated_at 
    BEFORE UPDATE ON assigned_route_customers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =====================================================
-- 9. SAMPLE QUERIES FOR COMMON OPERATIONS
-- =====================================================

/*
-- Query to get all active route assignments with full details
SELECT 
    ar.id as assignment_id,
    v.registration_no,
    v.fleet_no,
    r.Route,
    r.LocationCode,
    r.ServiceDays,
    ar.assigned_at,
    ar.status,
    ar.priority,
    ar.estimated_start_time,
    ar.estimated_end_time,
    COUNT(arc.id) as total_customers,
    COUNT(CASE WHEN arc.status = 'completed' THEN 1 END) as completed_customers,
    COUNT(CASE WHEN arc.status = 'pending' THEN 1 END) as pending_customers
FROM assigned_routes ar
JOIN vehicles v ON ar.vehicle_id = v.id
JOIN routes r ON ar.route_id = r.id
LEFT JOIN assigned_route_customers arc ON ar.id = arc.assigned_route_id
WHERE ar.status = 'active'
GROUP BY ar.id, v.registration_no, v.fleet_no, r.Route, r.LocationCode, r.ServiceDays, 
         ar.assigned_at, ar.status, ar.priority, ar.estimated_start_time, ar.estimated_end_time
ORDER BY ar.priority DESC, ar.assigned_at DESC;

-- Query to get customer assignments for a specific vehicle with sequence order
SELECT 
    arc.id,
    arc.sequence_order,
    cs.customer,
    cs.code,
    r.Route,
    r.LocationCode,
    arc.status,
    arc.estimated_duration_minutes,
    arc.actual_duration_minutes,
    arc.estimated_arrival_time,
    arc.actual_arrival_time,
    arc.service_notes
FROM assigned_route_customers arc
JOIN customer_stops cs ON arc.customer_stop_id = cs.id
JOIN routes r ON arc.route_id = r.id
JOIN vehicles v ON arc.vehicle_id = v.id
JOIN assigned_routes ar ON arc.assigned_route_id = ar.id
WHERE v.registration_no = 'BB34JSGP'
AND ar.status = 'active'
ORDER BY arc.sequence_order;

-- Query to get real-time tracking data for a vehicle
SELECT 
    art.latitude,
    art.longitude,
    art.speed,
    art.heading,
    art.status,
    art.recorded_at
FROM assigned_route_tracking art
JOIN assigned_routes ar ON art.assigned_route_id = ar.id
JOIN vehicles v ON ar.vehicle_id = v.id
WHERE v.registration_no = 'BB34JSGP'
AND ar.status = 'active'
ORDER BY art.recorded_at DESC
LIMIT 10;

*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================
