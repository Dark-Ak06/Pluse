export type UserRole = 'akim' | 'head' | 'curator' | 'inspector' | 'contractor';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  department?: string;
  contractor_id?: number;
}

export interface Contractor {
  id: number;
  name: string;
  bin: string;
  director_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  rating_score: number;
  is_systemic_problem: boolean;
  systemic_reason?: string;
  active_projects_count: number;
  delayed_projects_count: number;
  active_defects_count: number;
  overdue_defects_count: number;
}

export type ObjectType = 'construction' | 'major_repair' | 'medium_repair' | 'landscaping';
export type ObjectCategory = 'road' | 'social' | 'utilities';
export type ObjectStage = 'planning' | 'procurement' | 'construction' | 'acceptance' | 'operation';
export type ObjectHealth = 'on_schedule' | 'at_risk' | 'delayed';

export interface Milestone {
  id: number;
  object_id: number;
  title: string;
  planned_date: string;
  actual_date?: string;
  is_completed: boolean;
  is_overdue: boolean;
}

export interface StatusLog {
  id: number;
  object_id: number;
  prev_progress: number;
  new_progress: number;
  comment?: string;
  created_at: string;
}

export interface InfraObject {
  id: number;
  code: string;
  name: string;
  type: ObjectType;
  category: ObjectCategory;
  district: string;
  location_description?: string;
  latitude: number;
  longitude: number;
  budget_allocated: number;
  budget_spent: number;
  source_of_financing: string;
  curator_name?: string;
  curator_phone?: string;
  stage: ObjectStage;
  health_status: ObjectHealth;
  planned_start_date?: string;
  planned_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  planned_progress: number;
  actual_progress: number;
  last_status_update_at?: string;
  has_lag_flag: boolean;
  lag_points: number;
  has_milestone_overdue_flag: boolean;
  has_freshness_flag: boolean;
  days_since_update: number;
  has_budget_overrun_flag: boolean;
  budget_overrun_amount: number;
  flag_summary?: string;
  contractor_id?: number;
  contractor?: Contractor;
  linked_road_id?: number;
  linked_road_section_id?: number;
}

export interface InfraObjectDetail extends InfraObject {
  milestones: Milestone[];
  status_logs: StatusLog[];
  linked_defects_count: number;
  linked_overdue_defects_count: number;
}

export interface RoadSection {
  id: number;
  road_id: number;
  section_code: string;
  start_km: number;
  end_km: number;
  length_km: number;
  contractor_id?: number;
  center_latitude?: number;
  center_longitude?: number;
  last_inspected_at?: string;
  is_inspected_this_month: boolean;
  contractor?: Contractor;
}

export interface Road {
  id: number;
  code: string;
  name: string;
  total_length_km: number;
  category: string;
  district?: string;
  start_point?: string;
  end_point?: string;
  sections: RoadSection[];
}

export interface NetworkCoverage {
  total_km: number;
  inspected_km: number;
  coverage_percent: number;
  uninspected_sections_count: number;
  target_kpi_percent: number;
}

export type DefectType = 'pothole' | 'crack' | 'markings' | 'signage' | 'barrier' | 'other';
export type DefectSeverity = 'low' | 'medium' | 'high' | 'emergency';
export type DefectStatus = 'reported' | 'assigned' | 'in_progress' | 'fixed_pending_review' | 'verified_closed' | 'rejected' | 'escalated';

export interface Defect {
  id: number;
  code: string;
  road_id: number;
  road_section_id?: number;
  contractor_id?: number;
  inspector_id?: number;
  infra_object_id?: number;
  defect_type: DefectType;
  severity: DefectSeverity;
  description?: string;
  latitude: number;
  longitude: number;
  address_reference?: string;
  photo_before_url?: string;
  photo_after_url?: string;
  status: DefectStatus;
  reported_at: string;
  assigned_to_contractor_at?: string;
  handover_duration_seconds: number;
  deadline_at?: string;
  fixed_at?: string;
  verified_at?: string;
  is_overdue: boolean;
  escalation_level: number;
  has_systemic_flag: boolean;
  systemic_note?: string;
  contractor?: Contractor;
}

export interface DashboardKpi {
  total_objects: number;
  objects_on_schedule: number;
  objects_at_risk: number;
  objects_delayed: number;
  freshness_rate_percent: number;
  total_roads_km: number;
  inspected_roads_km: number;
  coverage_rate_percent: number;
  total_defects: number;
  defects_in_progress: number;
  defects_fixed: number;
  defects_overdue: number;
  defects_on_time_percent: number;
  avg_handover_minutes: number;
}

export interface DashboardData {
  kpi: DashboardKpi;
  top_lagging_objects: InfraObject[];
  top_problem_contractors: Contractor[];
  district_breakdown: { district: string; objects_count: number; delayed_count: number }[];
  stage_breakdown: { stage: string; label: string; count: number }[];
}
