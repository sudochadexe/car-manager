import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Dealership {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  dealership_id: string;
  name: string;
  pin: string;
  roles: string[];
  active: boolean;
  dashboard_view?: 'overview' | 'department';
  created_at: string;
}

export interface PipelineStage {
  id: string;
  dealership_id: string;
  order: number;
  stage_name: string;
  role: string;
  completion_field: string;
  completion_type: 'checkbox' | 'dropdown';
  list_name: string | null;
  target_hours: number;
  stage_color: string;
  is_terminal: boolean;
  created_at: string;
}

export interface Vehicle {
  id: string;
  dealership_id: string;
  row_id: number;
  stock_num: string;
  year: string;
  make: string;
  model: string;
  vin: string;
  status: string;
  age: number;
  in_system_date: string;
  notes: string;
  ro_num: string;
  estimate: number | null;
  actual: number | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface StageCompletion {
  id: string;
  vehicle_id: string;
  stage_id: string;
  completion_value: string;
  completed_by: string;
  completed_at: string | null;
  cleared_at: string | null;
}

export interface AuditLog {
  id: string;
  dealership_id: string;
  user_name: string;
  user_role: string;
  action: string;
  vehicle_desc: string;
  vehicle_id: string;
  field_name: string;
  old_value: string;
  new_value: string;
  created_at: string;
}

export interface DropdownList {
  id: string;
  dealership_id: string;
  list_name: string;
  values: string[];
  created_at: string;
}
