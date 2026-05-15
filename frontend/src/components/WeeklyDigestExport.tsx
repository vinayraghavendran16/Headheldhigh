import { useState, useEffect } from 'react';
import { Download, Users, Calendar } from 'lucide-react';
import { getWeeklyDigest } from '../services/api';
import type { DigestEntry } from '../types';

export default function WeeklyDigestExport() {
  const [entries, setEntries] = useState<DigestEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getWeeklyDigest()
      .then(setEntries)
      .catch(() => setError('Could not load digest data.'))
      .finally(() => setLoading(false));
  }, []);

  function exportCSV() {
    const BASE_URL = import.meta.env.VITE_API_URL || '';
    window.open(`${BASE_URL}/api/digest/weekly/export`, '_blank');
  }

  function exportCSVFallback() {
    if (entries.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Location', 'Desired Role', 'LinkedIn', 'Joined'];
    const rows = entries.map((e) => [
      e.id,
      e.name,
      e.email,
      e.location || '',
      e.desired_role || '',
      e.linkedin_url || '',
      new Date(e.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(String).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `talent-digest-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Weekly Digest
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">New users who joined this week</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8 text-gray-400">
          Loading...
        </div>
      )}

      {error && (
        <div className="text-red-600 text-sm py-4 text-center">{error}</div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No new users this week yet.</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Location</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3 font-medium text-gray-900">{entry.name}</td>
                  <td className="py-2 px-3 text-gray-600">{entry.email}</td>
                  <td className="py-2 px-3 text-gray-600">{entry.desired_role || '—'}</td>
                  <td className="py-2 px-3 text-gray-600">{entry.location || '—'}</td>
                  <td className="py-2 px-3 text-gray-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="h-3.5 w-3.5" />
            {entries.length} new member{entries.length !== 1 ? 's' : ''} this week
          </div>
        </div>
      )}
    </div>
  );
}
