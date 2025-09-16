-- Route Assignments Database Schema
-- This file contains the SQL queries to create the necessary tables for route assignments

-- 1. Route Assignments Table
-- This table stores the main route assignments to vehicles
CREATE TABLE IF NOT EXISTS route_assignments (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    assigned_by VARCHAR(255) DEFAULT 'system',
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Customer Assignments Table
-- This table stores individual customer stop assignments within a route assignment
CREATE TABLE IF NOT EXISTS customer_assignments (
    id BIGSERIAL PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES route_assignments(id) ON DELETE CASCADE,
    customer_stop_id BIGINT NOT NULL REFERENCES customer_stops(id) ON DELETE CASCADE,
    vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    estimated_duration_seconds INTEGER,
    estimated_duration_minutes INTEGER,
    actual_duration_seconds INTEGER,
    actual_duration_minutes INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_route_assignments_vehicle_id ON route_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_route_id ON route_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_status ON route_assignments(status);
CREATE INDEX IF NOT EXISTS idx_route_assignments_assigned_at ON route_assignments(assigned_at);

CREATE INDEX IF NOT EXISTS idx_customer_assignments_assignment_id ON customer_assignments(assignment_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_customer_stop_id ON customer_assignments(customer_stop_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_vehicle_id ON customer_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_route_id ON customer_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_customer_assignments_status ON customer_assignments(status);

-- 4. Unique constraints to prevent duplicate assignments
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_route_assignment 
ON route_assignments(vehicle_id, route_id) 
WHERE status = 'active';

-- 5. Sample queries for common operations

-- Query to get all active route assignments with vehicle and route details
/*
SELECT 
    ra.id as assignment_id,
    v.registration_no,
    v.fleet_no,
    r.Route,
    r.LocationCode,
    r.ServiceDays,
    ra.assigned_at,
    ra.status,
    COUNT(ca.id) as total_customers,
    COUNT(CASE WHEN ca.status = 'completed' THEN 1 END) as completed_customers
FROM route_assignments ra
JOIN vehicles v ON ra.vehicle_id = v.id
JOIN routes r ON ra.route_id = r.id
LEFT JOIN customer_assignments ca ON ra.id = ca.assignment_id
WHERE ra.status = 'active'
GROUP BY ra.id, v.registration_no, v.fleet_no, r.Route, r.LocationCode, r.ServiceDays, ra.assigned_at, ra.status
ORDER BY ra.assigned_at DESC;
*/

-- Query to get customer assignments for a specific vehicle
/*
SELECT 
    ca.id,
    cs.customer,
    cs.code,
    r.Route,
    r.LocationCode,
    ca.status,
    ca.estimated_duration_minutes,
    ca.actual_duration_minutes,
    ca.completed_at
FROM customer_assignments ca
JOIN customer_stops cs ON ca.customer_stop_id = cs.id
JOIN routes r ON ca.route_id = r.id
JOIN vehicles v ON ca.vehicle_id = v.id
WHERE v.registration_no = 'BB34JSGP'
AND ca.status IN ('pending', 'in_progress')
ORDER BY ca.assigned_at;
*/

-- Query to assign a route to a vehicle (this would be done via the server action)
/*
-- Step 1: Create route assignment
INSERT INTO route_assignments (vehicle_id, route_id, assigned_by)
SELECT v.id, r.id, 'system'
FROM vehicles v, routes r
WHERE v.registration_no = 'BB34JSGP' 
AND r.id = 123;

-- Step 2: Create customer assignments
INSERT INTO customer_assignments (assignment_id, customer_stop_id, vehicle_id, route_id, estimated_duration_seconds, estimated_duration_minutes)
SELECT 
    ra.id,
    cs.id,
    ra.vehicle_id,
    ra.route_id,
    cs.avg_seconds,
    cs.avg_minutes
FROM route_assignments ra
JOIN customer_stops cs ON cs.code = (
    SELECT LocationCode FROM routes WHERE id = ra.route_id
)
WHERE ra.vehicle_id = (SELECT id FROM vehicles WHERE registration_no = 'BB34JSGP')
AND ra.route_id = 123
AND ra.status = 'active';
*/
