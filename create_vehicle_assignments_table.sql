-- Create vehicle_assignments table to store vehicle-customer assignments
CREATE TABLE IF NOT EXISTS vehicle_assignments (
  id SERIAL PRIMARY KEY,
  vehicle_registration TEXT NOT NULL,
  route_id INTEGER NOT NULL,
  route_name TEXT NOT NULL,
  location_code TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_by UUID DEFAULT auth.uid(),
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vehicle_assignment_customers table to store customer details for each assignment
CREATE TABLE IF NOT EXISTS vehicle_assignment_customers (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES vehicle_assignments(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL,
  customer_name TEXT,
  customer_code TEXT,
  customer_type TEXT,
  customer_status TEXT,
  customer_hours TEXT,
  customer_arrival TEXT,
  collection_bags TEXT,
  delivery_bags TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_registration ON vehicle_assignments(vehicle_registration);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_route ON vehicle_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_status ON vehicle_assignments(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignment_customers_assignment ON vehicle_assignment_customers(assignment_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignment_customers_customer ON vehicle_assignment_customers(customer_id);

-- Add RLS policies
ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_assignment_customers ENABLE ROW LEVEL SECURITY;

-- Policy for vehicle_assignments
CREATE POLICY "Users can view vehicle assignments" ON vehicle_assignments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vehicle assignments" ON vehicle_assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update vehicle assignments" ON vehicle_assignments
  FOR UPDATE USING (true);

-- Policy for vehicle_assignment_customers
CREATE POLICY "Users can view vehicle assignment customers" ON vehicle_assignment_customers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vehicle assignment customers" ON vehicle_assignment_customers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update vehicle assignment customers" ON vehicle_assignment_customers
  FOR UPDATE USING (true);
