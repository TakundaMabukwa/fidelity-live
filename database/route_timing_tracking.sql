-- =====================================================
-- ROUTE TIMING TRACKING TABLE
-- =====================================================
-- This table stores estimated vs actual route completion times
-- for performance analysis and route optimization

CREATE TABLE IF NOT EXISTS route_timing_logs (
  id BIGSERIAL PRIMARY KEY,
  route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  assigned_route_id BIGINT REFERENCES assigned_routes(id) ON DELETE SET NULL,
  vehicle_id BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  route_name TEXT NOT NULL,
  vehicle_registration TEXT NOT NULL,
  
  -- Timing Data
  estimated_total_time_minutes INTEGER NOT NULL,
  actual_total_time_minutes INTEGER,
  time_difference_minutes INTEGER,
  
  -- Route Status
  route_status VARCHAR(20) DEFAULT 'active' CHECK (route_status IN ('active', 'completed', 'cancelled', 'paused')),
  completion_status VARCHAR(20) DEFAULT 'pending' CHECK (completion_status IN ('pending', 'completed', 'incomplete', 'failed')),
  
  -- Timestamps
  route_start_time TIMESTAMP WITH TIME ZONE,
  route_end_time TIMESTAMP WITH TIME ZONE,
  base_arrival_time TIMESTAMP WITH TIME ZONE,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Performance Metrics
  efficiency_percentage DECIMAL(5,2),
  
  -- Additional Data
  total_stops INTEGER,
  completed_stops INTEGER,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID DEFAULT auth.uid()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_route_id ON route_timing_logs(route_id);
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_assigned_route_id ON route_timing_logs(assigned_route_id);
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_vehicle_id ON route_timing_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_vehicle_registration ON route_timing_logs(vehicle_registration);

-- Date and status indexes
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_upload_date ON route_timing_logs(upload_date);
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_route_status ON route_timing_logs(route_status);
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_completion_status ON route_timing_logs(completion_status);

-- Performance analysis indexes
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_efficiency ON route_timing_logs(efficiency_percentage);
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_time_difference ON route_timing_logs(time_difference_minutes);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_route_vehicle_date ON route_timing_logs(route_id, vehicle_id, upload_date);
CREATE INDEX IF NOT EXISTS idx_route_timing_logs_status_date ON route_timing_logs(completion_status, upload_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE route_timing_logs ENABLE ROW LEVEL SECURITY;

-- Policies for route timing logs
CREATE POLICY "Users can view route timing logs" ON route_timing_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert route timing logs" ON route_timing_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update route timing logs" ON route_timing_logs FOR UPDATE USING (true);
CREATE POLICY "Users can delete route timing logs" ON route_timing_logs FOR DELETE USING (true);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to calculate derived timing values
CREATE OR REPLACE FUNCTION calculate_route_timing_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate time difference
  IF NEW.actual_total_time_minutes IS NOT NULL THEN
    NEW.time_difference_minutes = NEW.actual_total_time_minutes - NEW.estimated_total_time_minutes;
  ELSE
    NEW.time_difference_minutes = NULL;
  END IF;
  
  -- Calculate efficiency percentage
  IF NEW.actual_total_time_minutes IS NOT NULL AND NEW.estimated_total_time_minutes > 0 THEN
    NEW.efficiency_percentage = ROUND((NEW.estimated_total_time_minutes::DECIMAL / NEW.actual_total_time_minutes::DECIMAL) * 100, 2);
  ELSE
    NEW.efficiency_percentage = NULL;
  END IF;
  
  -- Update timestamp
  NEW.updated_at = NOW();
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for calculating derived values and updating timestamp
CREATE TRIGGER calculate_route_timing_values_trigger 
  BEFORE INSERT OR UPDATE ON route_timing_logs 
  FOR EACH ROW 
  EXECUTE FUNCTION calculate_route_timing_values();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate route completion time
CREATE OR REPLACE FUNCTION calculate_route_completion_time(
  p_vehicle_id BIGINT,
  p_route_start_time TIMESTAMP WITH TIME ZONE,
  p_base_arrival_time TIMESTAMP WITH TIME ZONE
) RETURNS INTEGER AS $$
BEGIN
  IF p_route_start_time IS NULL OR p_base_arrival_time IS NULL THEN
    RETURN NULL;
  END IF;
  
  RETURN EXTRACT(EPOCH FROM (p_base_arrival_time - p_route_start_time)) / 60;
END;
$$ LANGUAGE plpgsql;

-- Function to get vehicle base arrival time from live data
CREATE OR REPLACE FUNCTION get_vehicle_base_arrival_time(
  p_vehicle_registration TEXT
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  base_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- This would need to be updated based on your actual live data table structure
  -- For now, returning NULL as placeholder
  SELECT MAX(recorded_at) INTO base_time
  FROM fidelity_live_feed 
  WHERE Plate = p_vehicle_registration 
    AND base = true
    AND recorded_at >= CURRENT_DATE;
    
  RETURN base_time;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE QUERIES FOR ANALYSIS
-- =====================================================

/*
-- Query to get route performance summary
SELECT 
  route_name,
  vehicle_registration,
  estimated_total_time_minutes,
  actual_total_time_minutes,
  time_difference_minutes,
  efficiency_percentage,
  completion_status,
  upload_date
FROM route_timing_logs 
WHERE upload_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY upload_date DESC, efficiency_percentage DESC;

-- Query to get average performance by route
SELECT 
  route_name,
  COUNT(*) as total_routes,
  AVG(estimated_total_time_minutes) as avg_estimated_time,
  AVG(actual_total_time_minutes) as avg_actual_time,
  AVG(time_difference_minutes) as avg_time_difference,
  AVG(efficiency_percentage) as avg_efficiency
FROM route_timing_logs 
WHERE completion_status = 'completed'
  AND upload_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY route_name
ORDER BY avg_efficiency DESC;

-- Query to get vehicle performance
SELECT 
  vehicle_registration,
  COUNT(*) as total_routes,
  AVG(efficiency_percentage) as avg_efficiency,
  COUNT(CASE WHEN completion_status = 'completed' THEN 1 END) as completed_routes
FROM route_timing_logs 
WHERE upload_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY vehicle_registration
ORDER BY avg_efficiency DESC;
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================
