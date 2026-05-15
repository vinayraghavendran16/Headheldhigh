import axios from 'axios';
import type {
  User,
  UserCreate,
  Resume,
  JobMatch,
  Application,
  ApplicationStatus,
  TalentPoolEntry,
  SkillsGapReport,
  PaginatedResponse,
  DigestEntry,
  PlatformStats,
} from '../types';

const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === 'true';
const BASE_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 1,
  name: 'Alex Johnson',
  email: 'alex@example.com',
  linkedin_url: 'https://linkedin.com/in/alexjohnson',
  location: 'San Francisco, CA',
  desired_role: 'Senior Software Engineer',
  open_to_remote: true,
  is_public: true,
  created_at: new Date().toISOString(),
};

const mockResume: Resume = {
  id: 1,
  user_id: 1,
  filename: 'resume.pdf',
  skills: ['Python', 'React', 'TypeScript', 'SQL', 'AWS', 'Docker', 'FastAPI', 'PostgreSQL'],
  experience_years: 7,
  education: 'BS Computer Science, UC Berkeley',
  job_titles: ['Senior Software Engineer', 'Full Stack Developer'],
  industries: ['FinTech', 'SaaS'],
  summary: 'Experienced software engineer with 7 years building scalable web applications.',
  parsed_at: new Date().toISOString(),
};

const mockJobs = [
  { id: 1, external_id: 'mock-1', title: 'Senior Software Engineer', company: 'Stripe', location: 'San Francisco, CA', description: 'Build payment infrastructure at scale. Python, React required.', url: 'https://stripe.com/jobs', salary_min: 160000, salary_max: 220000, job_type: 'FULLTIME', source: 'Mock' },
  { id: 2, external_id: 'mock-2', title: 'Full Stack Engineer', company: 'Airbnb', location: 'Remote', description: 'Join our platform team. React, TypeScript, Python a plus.', url: 'https://airbnb.com/careers', salary_min: 150000, salary_max: 200000, job_type: 'FULLTIME', source: 'Mock' },
  { id: 3, external_id: 'mock-3', title: 'Backend Engineer', company: 'Plaid', location: 'New York, NY', description: 'Build APIs for financial data. Go, Python, PostgreSQL.', url: 'https://plaid.com/careers', salary_min: 140000, salary_max: 190000, job_type: 'FULLTIME', source: 'Mock' },
];

const mockMatches: JobMatch[] = mockJobs.map((job, i) => ({
  id: i + 1,
  user_id: 1,
  job_id: job.id,
  relevance_score: [92, 78, 61][i],
  match_reasons: [
    ['7 years experience matches requirement', 'Python & React expertise aligned', 'SaaS background relevant'],
    ['TypeScript skills match perfectly', 'React experience strong fit', 'Remote-friendly role'],
    ['Python backend experience relevant', 'SQL skills applicable', 'API development background'],
  ][i],
  missing_skills: [['Kubernetes', 'Go'], ['GraphQL'], ['Go', 'Kubernetes', 'Redis']][i],
  created_at: new Date().toISOString(),
  job,
}));

const mockGap: SkillsGapReport = {
  user_id: 1,
  top_missing_skills: [
    { skill: 'Kubernetes', frequency: 8, priority: 'high', reason: 'Required by most senior engineering roles in your target companies.' },
    { skill: 'Go', frequency: 5, priority: 'high', reason: 'Increasingly common in backend infrastructure roles.' },
    { skill: 'GraphQL', frequency: 3, priority: 'medium', reason: 'Modern API layer used by many product companies.' },
    { skill: 'Redis', frequency: 2, priority: 'medium', reason: 'Caching layer frequently required in high-scale systems.' },
    { skill: 'Terraform', frequency: 2, priority: 'low', reason: 'Infrastructure-as-code skill valued at cloud-native companies.' },
  ],
  summary: 'Your Python and React skills are strong and match well with most senior engineering roles. The primary gaps are in cloud-native technologies (Kubernetes, Terraform) and systems languages (Go).',
  recommended_resources: [
    'Kubernetes for Developers – Linux Foundation (LFD459)',
    'Go Programming Language – Tour of Go (golang.org)',
    'GraphQL – Official documentation + Fullstack Open course',
    'Redis University – Free online courses (university.redis.com)',
    'HashiCorp Terraform – Official tutorials',
  ],
};

const mockTalentPool: TalentPoolEntry[] = [
  { id: 1, name: 'Alex Johnson', email: 'alex@example.com', linkedin_url: 'https://linkedin.com/in/alex', location: 'San Francisco, CA', desired_role: 'Senior Software Engineer', open_to_remote: true, skills: ['Python', 'React', 'AWS'], experience_years: 7, job_titles: ['Senior SWE'], created_at: new Date().toISOString() },
  { id: 2, name: 'Maria Garcia', email: 'maria@example.com', linkedin_url: 'https://linkedin.com/in/maria', location: 'Austin, TX', desired_role: 'Data Scientist', open_to_remote: false, skills: ['Python', 'TensorFlow', 'SQL', 'R'], experience_years: 5, job_titles: ['Data Scientist'], created_at: new Date().toISOString() },
  { id: 3, name: 'James Park', email: 'james@example.com', location: 'New York, NY', desired_role: 'Product Manager', open_to_remote: true, skills: ['Roadmapping', 'SQL', 'Figma', 'Jira'], experience_years: 6, job_titles: ['Product Manager'], created_at: new Date().toISOString() },
];

// ─── API functions ─────────────────────────────────────────────────────────────

export async function registerUser(data: UserCreate): Promise<User> {
  if (MOCK_MODE) return { ...mockUser, ...data, id: Date.now() };
  const res = await api.post<User>('/api/users/register', data);
  return res.data;
}

export async function getUser(userId: number): Promise<User> {
  if (MOCK_MODE) return mockUser;
  const res = await api.get<User>(`/api/users/${userId}`);
  return res.data;
}

export async function uploadResume(userId: number, file: File): Promise<Resume> {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 1500));
    return mockResume;
  }
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<Resume>(`/api/resumes/upload?user_id=${userId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function getResume(userId: number): Promise<Resume> {
  if (MOCK_MODE) return mockResume;
  const res = await api.get<Resume>(`/api/resumes/${userId}`);
  return res.data;
}

export async function getUserMatches(
  userId: number,
  page = 1,
  pageSize = 20,
  minScore = 0,
): Promise<PaginatedResponse<JobMatch>> {
  if (MOCK_MODE) {
    return { items: mockMatches, total: mockMatches.length, page: 1, page_size: 20, pages: 1 };
  }
  const res = await api.get<PaginatedResponse<JobMatch>>(`/api/users/${userId}/matches`, {
    params: { page, page_size: pageSize, min_score: minScore },
  });
  return res.data;
}

export async function getSkillsGap(userId: number): Promise<SkillsGapReport> {
  if (MOCK_MODE) return mockGap;
  const res = await api.get<SkillsGapReport>(`/api/users/${userId}/gap`);
  return res.data;
}

export async function refreshJobs(userId: number): Promise<{ message: string; new_matches: number }> {
  if (MOCK_MODE) {
    await new Promise(r => setTimeout(r, 2000));
    return { message: 'Scored 10 new jobs.', new_matches: 10 };
  }
  const res = await api.get<{ message: string; new_matches: number }>(`/api/jobs/refresh/${userId}`);
  return res.data;
}

export async function createApplication(
  userId: number,
  jobId: number,
  status: ApplicationStatus,
  notes?: string,
): Promise<Application> {
  if (MOCK_MODE) {
    const job = mockJobs.find(j => j.id === jobId) || mockJobs[0];
    return { id: Date.now(), user_id: userId, job_id: jobId, status, notes, applied_at: new Date().toISOString(), job };
  }
  const res = await api.post<Application>('/api/applications', { user_id: userId, job_id: jobId, status, notes });
  return res.data;
}

export async function getUserApplications(userId: number): Promise<Application[]> {
  if (MOCK_MODE) return [];
  const res = await api.get<Application[]>(`/api/applications/${userId}`);
  return res.data;
}

export async function getTalentPool(
  page = 1,
  pageSize = 20,
  filters: { skill?: string; location?: string; role?: string } = {},
): Promise<PaginatedResponse<TalentPoolEntry>> {
  if (MOCK_MODE) {
    return { items: mockTalentPool, total: mockTalentPool.length, page: 1, page_size: 20, pages: 1 };
  }
  const res = await api.get<PaginatedResponse<TalentPoolEntry>>('/api/talent-pool', {
    params: { page, page_size: pageSize, ...filters },
  });
  return res.data;
}

export async function getWeeklyDigest(): Promise<DigestEntry[]> {
  if (MOCK_MODE) return [];
  const res = await api.get<DigestEntry[]>('/api/digest/weekly');
  return res.data;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  if (MOCK_MODE) return { talent_pool_count: 1247, jobs_matched_total: 18432 };
  const res = await api.get<PlatformStats>('/api/stats');
  return res.data;
}
