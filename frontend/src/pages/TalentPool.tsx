import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  Linkedin,
  Users,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Wifi,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { getTalentPool } from '../services/api';
import type { TalentPoolEntry } from '../types';

export default function TalentPool() {
  const [entries, setEntries] = useState<TalentPoolEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [skillFilter, setSkillFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const userId = localStorage.getItem('userId');

  const load = useCallback(async (p: number, skill: string, location: string, role: string) => {
    setLoading(true);
    try {
      const result = await getTalentPool(p, 20, { skill, location, role });
      setEntries(result.items);
      setTotal(result.total);
      setPages(result.pages);
    } catch {
      setError('Failed to load talent pool.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, skillFilter, locationFilter, roleFilter);
  }, [page, skillFilter, locationFilter, roleFilter, load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1, skillFilter, locationFilter, roleFilter);
  }

  function clearFilters() {
    setSkillFilter('');
    setLocationFilter('');
    setRoleFilter('');
    setPage(1);
    load(1, '', '', '');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar userId={userId ? Number(userId) : undefined} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Talent Pool</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Laid-off professionals actively looking for their next opportunity.
            This data is shared weekly with recruiters and on LinkedIn to help connect talent with companies.
          </p>
          {total > 0 && (
            <div className="mt-3 inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium">
              <Users className="h-4 w-4" />
              {total} professional{total !== 1 ? 's' : ''} in the pool
            </div>
          )}
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by skill (e.g. Python)"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            {(skillFilter || locationFilter || roleFilter) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5"
              >
                Clear filters
              </button>
            )}
            <button
              type="submit"
              className="bg-indigo-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="text-red-600 text-center py-6">{error}</div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-24 mb-3" />
                <div className="flex gap-1.5 flex-wrap">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-6 bg-gray-100 rounded-full w-14" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-700 mb-1">No results found</h3>
            <p className="text-gray-500 text-sm">Try adjusting your search filters.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{entry.name}</h3>
                      {entry.desired_role && (
                        <p className="text-sm text-indigo-600 font-medium mt-0.5">{entry.desired_role}</p>
                      )}
                    </div>
                    {entry.linkedin_url && (
                      <a
                        href={entry.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 transition-colors"
                        title="View LinkedIn profile"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-3">
                    {entry.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {entry.location}
                      </span>
                    )}
                    {entry.open_to_remote && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Wifi className="h-3 w-3" />
                        Remote OK
                      </span>
                    )}
                    {entry.experience_years !== undefined && entry.experience_years !== null && (
                      <span>{entry.experience_years}y exp</span>
                    )}
                  </div>

                  {/* Skills */}
                  {entry.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {entry.skills.slice(0, 6).map((skill) => (
                        <span key={skill} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                          {skill}
                        </span>
                      ))}
                      {entry.skills.length > 6 && (
                        <span className="text-xs text-gray-400 px-1 py-0.5">
                          +{entry.skills.length - 6}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
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

        {/* CTA for non-members */}
        {!userId && (
          <div className="mt-12 bg-indigo-600 rounded-2xl p-8 text-center text-white">
            <h3 className="text-xl font-bold mb-2">Want to be in the pool?</h3>
            <p className="text-indigo-200 mb-5 text-sm">
              Upload your resume to join and get matched to hundreds of open jobs.
            </p>
            <Link
              to="/onboarding"
              className="inline-block bg-white text-indigo-700 font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Join for free
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
