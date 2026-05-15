export interface User {
  id: number;
  name: string;
  email: string;
  linkedin_url?: string;
  location?: string;
  desired_role?: string;
  open_to_remote: boolean;
  is_public: boolean;
  created_at: string;
}

export interface UserCreate {
  name: string;
  email: string;
  linkedin_url?: string;
  location?: string;
  desired_role?: string;
  open_to_remote?: boolean;
  is_public?: boolean;
}

export interface Resume {
  id: number;
  user_id: number;
  filename: string;
  skills: string[];
  experience_years?: number;
  education?: string;
  job_titles: string[];
  industries: string[];
  summary?: string;
  parsed_at?: string;
}

export interface JobPosting {
  id: number;
  external_id: string;
  title: string;
  company?: string;
  location?: string;
  description?: string;
  url?: string;
  salary_min?: number;
  salary_max?: number;
  job_type?: string;
  posted_at?: string;
  source?: string;
}

export interface JobMatch {
  id: number;
  user_id: number;
  job_id: number;
  relevance_score: number;
  match_reasons: string[];
  missing_skills: string[];
  created_at: string;
  job: JobPosting;
}

export interface Application {
  id: number;
  user_id: number;
  job_id: number;
  status: ApplicationStatus;
  notes?: string;
  applied_at: string;
  job: JobPosting;
}

export type ApplicationStatus = 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';

export interface TalentPoolEntry {
  id: number;
  name: string;
  email: string;
  linkedin_url?: string;
  location?: string;
  desired_role?: string;
  open_to_remote: boolean;
  skills: string[];
  experience_years?: number;
  job_titles: string[];
  created_at: string;
}

export interface SkillGapItem {
  skill: string;
  frequency: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface SkillsGapReport {
  user_id: number;
  top_missing_skills: SkillGapItem[];
  summary: string;
  recommended_resources: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface DigestEntry {
  id: number;
  name: string;
  email: string;
  location?: string;
  desired_role?: string;
  linkedin_url?: string;
  created_at: string;
}

export interface PlatformStats {
  talent_pool_count: number;
  jobs_matched_total: number;
}
