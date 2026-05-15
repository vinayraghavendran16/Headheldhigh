import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RefreshCw, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import JobCard from '../components/JobCard';
import SkillsGapCard from '../components/SkillsGapCard';
import ApplicationTracker from '../components/ApplicationTracker';
import {
  getUser,
  getResume,
  getUserMatches,
  getSkillsGap,
  getUserApplications,
  createApplication,
  refreshJobs,
} from '../services/api';
import type {
  User,
  Resume,
  JobMatch,
  Application,
  SkillsGapReport,
  ApplicationStatus,
} from '../types';

export default function Dashboard() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const uid = Number(userId);

  const [user, setUser] = useState<User | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [gapReport, setGapReport] = useState<SkillsGapReport | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingGap, setLoadingGap] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!uid) { navigate('/'); return; }

    async function load() {
      try {
        const [u, r, apps] = await Promise.all([
          getUser(uid),
          getResume(uid).catch(() => null),
          getUserApplications(uid).catch(() => [] as Application[]),
        ]);
        setUser(u);
        setResume(r);
        setApplications(apps);
      } catch {
        setError('Failed to load your profile. Please try again.');
      }
    }
    load();
  }, [uid, navigate]);

  const loadMatches = useCallback(async (p: number) => {
    setLoadingMatches(true);
    try {
      const result = await getUserMatches(uid, p);
      setMatches(result.items);
      setTotal(result.total);
      setPages(result.pages);
    } catch {
      setError('Failed to load job matches.');
    } finally {
      setLoadingMatches(false);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    loadMatches(page);
  }, [uid, page, loadMatches]);

  useEffect(() => {
    if (!uid) return;
    setLoadingGap(true);
    getSkillsGap(uid)
      .then(setGapReport)
      .catch(() => setGapReport(null))
      .finally(() => setLoadingGap(false));
  }, [uid]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await refreshJobs(uid);
      setPage(1);
      await loadMatches(1);
      const gap = await getSkillsGap(uid).catch(() => null);
      if (gap) setGapReport(gap);
    } catch {
      setError('Failed to refresh jobs. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleApplicationAction(jobId: number, status: ApplicationStatus) {
    try {
      const app = await createApplication(uid, jobId, status);
      setApplications((prev) => {
        const idx = prev.findIndex((a) => a.job_id === jobId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = app;
          return updated;
        }
        return [app, ...prev];
      });
    } catch {
      // silently ignore
    }
  }

  function getApplicationStatus(jobId: number): ApplicationStatus | undefined {
    return applications.find((a) => a.job_id === jobId)?.status;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar userId={uid} />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{error}</h2>
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:underline"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userId={uid} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your Dashboard'}
            </h1>
            {user?.desired_role && (
              <p className="text-gray-500 mt-1">Looking for: {user.desired_role}</p>
            )}
            {/* Skills tags */}
            {resume && resume.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {resume.skills.slice(0, 10).map((skill) => (
                  <span key={skill} className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
                {resume.skills.length > 10 && (
                  <span className="text-xs text-gray-400 px-2 py-1">
                    +{resume.skills.length - 10} more
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-indigo-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRefreshing ? 'Refreshing...' : 'Refresh Jobs'}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main: Job matches */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Job Matches{' '}
                {total > 0 && (
                  <span className="text-sm font-normal text-gray-500">({total} total)</span>
                )}
              </h2>
            </div>

            {loadingMatches ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
                    <div className="h-5 bg-gray-200 rounded w-48 mb-3" />
                    <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
                    <div className="h-4 bg-gray-100 rounded w-full" />
                  </div>
                ))}
              </div>
            ) : matches.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
                <p className="text-gray-500 mb-3">No job matches yet.</p>
                <button
                  onClick={handleRefresh}
                  className="text-indigo-600 font-medium hover:underline"
                >
                  Click to find jobs →
                </button>
              </div>
            ) : (
              <>
                {matches.map((match) => (
                  <JobCard
                    key={match.id}
                    match={match}
                    onSave={handleApplicationAction}
                    applicationStatus={getApplicationStatus(match.job.id)}
                  />
                ))}

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40 hover:text-indigo-600 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" /> Previous
                    </button>
                    <span className="text-sm text-gray-500">
                      Page {page} of {pages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="flex items-center gap-1 text-sm text-gray-600 disabled:opacity-40 hover:text-indigo-600 transition-colors"
                    >
                      Next <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Skills Gap */}
            {gapReport ? (
              <SkillsGapCard report={gapReport} isLoading={loadingGap} />
            ) : (
              <SkillsGapCard
                report={{
                  user_id: uid,
                  top_missing_skills: [],
                  summary: 'Refresh jobs to generate your skills gap analysis.',
                  recommended_resources: [],
                }}
                isLoading={loadingGap}
              />
            )}

            {/* Application Tracker */}
            <ApplicationTracker applications={applications} />
          </div>
        </div>
      </div>
    </div>
  );
}
