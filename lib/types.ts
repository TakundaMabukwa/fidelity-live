export interface Branch {
  id: string;
  name: string;
  location: string;
  manager: string;
  contact: string;
  status: 'active' | 'inactive';
}

export interface Route {
  id: number;
  created_at: string;
  Route: string;
  LocationCode: string;
  ServiceDays: string | null; // text field with comma-separated values
  userGroup: string;
  WeekNumber: string;
  StartDate: string;
  EndDate: string;
  Inactive: boolean;
  LastUpdated: string;
  LastUpdatedUser: string;
  RouteId: string;
}

export interface Customer {
  id: number;
  type: string | null;
  code: string | null;
  customer: string | null;
  status: string | null;
  status_time: string | null;
  hours: string | null;
  "h/c": string | null;
  min: string | null;
  "m/c": string | null;
  sec: string | null;
  duration_in_sec: string | null;
  duration: string | null;
  collection_bags: string | null;
  delivery_bags: string | null;
}

export interface Driver {
  no: number;
  comp_no: string | null;
  surname: string | null;
  initial: string | null;
  full_names: string | null;
  cell: string | null;
}

export interface Staff {
  id: number;
  comp_no: string | null;
  surname: string | null;
  initial: string | null;
  full_names: string | null;
  cell: string | null;
  job_description_remarks: string | null;
}

export interface RouteAssignment {
  id: string;
  route: string;
  locationCode: string;
  serviceDays: string[];
  userGroup: string;
  created: string;
}

export interface Vehicle {
  id: number;
  structure_name: string | null;
  registration_no: string | null;
  fleet_no: string | null;
  manufacturer: string | null;
  schedule: string | null;
}

export interface BranchDetail {
  id: string;
  branch: string;
  branchCode: string;
  footprint: string;
  physicalAddress: string;
  gpsCoordinates: string;
}

export interface CustomerDetail {
  id: string;
  type: string;
  code: string;
  customer: string;
  status: string;
  statusTime: string;
  reason: string;
  fault: string;
  hours: string;
  min: string;
  testType: string;
  duration: string;
  sec: string;
  startTime: string;
  announceTime: string;
  plannedArrival: string;
  plannedDeparture: string;
  actualArrival: string;
  collectionBag: string;
  deliveryBag: string;
  location: string;
}

export interface DriverDetail {
  id: string;
  no: string;
  compNo: string;
  surname: string;
  initial: string;
  fullNames: string;
  idNumber: string;
  cellNumber: string;
  jobDescription: string;
  category: 'ADMIN' | 'TEAM LEADERS' | 'CONTROLLERS' | 'BOX ROOM OPERATORS' | 'DRIVERS';
}

export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

export interface StatsCard {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'orange' | 'purple';
}

export interface AssignedLoad {
  id?: number;
  route_name?: string;
  rev?: string;
  created?: string;
  queue_date?: string;
  external_key?: string;
  name?: string;
  display?: string;
  location_code?: string;
  location_name?: string;
  user_type?: string;
  service_type?: string;
  atm_order_service_type?: string;
  planned_arrival?: string;
  planned_depart?: string;
  description?: string;
  device_user?: string;
  duration?: string;
  status?: string;
  current_status_since?: string;
  location?: string;
  current_queue?: string;
  current_queue_desc?: string;
  queue_status?: string;
  start_date?: string;
  status_since?: string;
  current_action?: string;
  current_action_desc?: string;
  action_status?: string;
  casd?: string;
  reject_reason?: string;
  reject_fault?: string;
  reject_comment?: string;
  created_on_client?: string;
  added_by_user?: string;
  scan_type?: string;
  print_duration?: string;
  crew?: Record<string, unknown> | null;
  once_off?: boolean;
  day?: string;
}