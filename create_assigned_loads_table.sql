-- Create the assigned_loads table (matching the actual schema)
CREATE TABLE IF NOT EXISTS assigned_loads (
    id SERIAL PRIMARY KEY,
    route_name TEXT DEFAULT NULL,
    rev TEXT DEFAULT NULL,
    created TEXT DEFAULT NULL,
    queue_date TEXT DEFAULT NULL,
    external_key TEXT DEFAULT NULL,
    name TEXT DEFAULT NULL,
    display TEXT DEFAULT NULL,
    location_code TEXT DEFAULT NULL,
    location_name TEXT DEFAULT NULL,
    user_type TEXT DEFAULT NULL,
    service_type TEXT DEFAULT NULL,
    atm_order_service_type TEXT DEFAULT NULL,
    planned_arrival TEXT DEFAULT NULL,
    planned_depart TEXT DEFAULT NULL,
    description TEXT DEFAULT NULL,
    device_user TEXT DEFAULT NULL,
    duration TEXT DEFAULT NULL,
    status TEXT DEFAULT NULL,
    current_status_since TEXT DEFAULT NULL,
    location TEXT DEFAULT NULL,
    current_queue TEXT DEFAULT NULL,
    current_queue_desc TEXT DEFAULT NULL,
    queue_status TEXT DEFAULT NULL,
    start_date TEXT DEFAULT NULL,
    status_since TEXT DEFAULT NULL,
    current_action TEXT DEFAULT NULL,
    current_action_desc TEXT DEFAULT NULL,
    action_status TEXT DEFAULT NULL,
    casd TEXT DEFAULT NULL,
    reject_reason TEXT DEFAULT NULL,
    reject_fault TEXT DEFAULT NULL,
    reject_comment TEXT DEFAULT NULL,
    created_on_client TEXT DEFAULT NULL,
    added_by_user TEXT DEFAULT NULL,
    scan_type TEXT DEFAULT NULL,
    print_duration TEXT DEFAULT NULL,
    crew JSONB DEFAULT NULL,
    once_off BOOLEAN DEFAULT FALSE,
    day TEXT DEFAULT NULL
);

-- Create an index on the day column for faster queries
CREATE INDEX IF NOT EXISTS idx_assigned_loads_day ON assigned_loads(day);

-- Create an index on the status column for filtering
CREATE INDEX IF NOT EXISTS idx_assigned_loads_status ON assigned_loads(status);
