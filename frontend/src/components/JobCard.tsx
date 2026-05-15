import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  MapPin,
  Building2,
  DollarSign,
  Bookmark,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';
import type { JobMatch, ApplicationStatus } from '../types';

interface JobCardProps {
  match: JobMatch;
  onSave?: (jobId: number, status: ApplicationStatus) => void;
  applicationStatus?: ApplicationStatus;
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? 'bg-green-100 text-green-700 border-green-200'
      : score >= 60
        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
        : 'bg-orange-100 text-orange-700 border-orange-200';

  return (
    <span className={clsx('text-sm font-bold px-2.5 py-1 rounded-full border', color)}>
      {score}% match
    </span>
  );
}

function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return '';
  const fmt = (n: number) =>
    n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n.toLocaleString()}`;
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  if (min) return `From ${fmt(min)}`;
  return `Up to ${fmt(max!)}`;
}

export default function JobCard({ match, onSave, applicationStatus }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { job } = match;
  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 text-base leading-tight">{job.title}</h3>
            <ScoreBadge score={match.relevance_score} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-gray-500">
            {job.company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                {job.company}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {job.location}
              </span>
            )}
            {salary && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {salary}
              </span>
            )}
            {job.job_type && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded">
                {job.job_type.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Missing skills */}
      {match.missing_skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {match.missing_skills.map((skill) => (
            <span
              key={skill}
              className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Expandable reasons */}
      {match.match_reasons.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" /> Hide why you match
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" /> Why you match
              </>
            )}
          </button>

          {expanded && (
            <ul className="mt-2 space-y-1">
              {match.match_reasons.map((reason, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Apply <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {onSave && (
          <>
            <button
              onClick={() => onSave(job.id, 'saved')}
              className={clsx(
                'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors',
                applicationStatus === 'saved'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-gray-300 text-gray-600 hover:border-indigo-300 hover:text-indigo-600',
              )}
            >
              <Bookmark className="h-3.5 w-3.5" />
              {applicationStatus === 'saved' ? 'Saved' : 'Save'}
            </button>

            <button
              onClick={() => onSave(job.id, 'applied')}
              className={clsx(
                'flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors',
                applicationStatus === 'applied'
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'border-gray-300 text-gray-600 hover:border-green-300 hover:text-green-600',
              )}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {applicationStatus === 'applied' ? 'Applied' : 'Mark applied'}
            </button>
          </>
        )}

        {job.source && (
          <span className="text-xs text-gray-400 ml-auto">via {job.source}</span>
        )}
      </div>
    </div>
  );
}
