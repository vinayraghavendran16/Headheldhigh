import type { ReactNode } from 'react';
import { Briefcase, Clock, CheckCircle, XCircle, Star, MessageSquare } from 'lucide-react';
import clsx from 'clsx';
import type { Application, ApplicationStatus } from '../types';

interface ApplicationTrackerProps {
  applications: Application[];
  onStatusChange?: (applicationId: number, status: ApplicationStatus) => void;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; icon: ReactNode }> = {
  saved: {
    label: 'Saved',
    color: 'bg-gray-100 text-gray-700',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  applied: {
    label: 'Applied',
    color: 'bg-blue-100 text-blue-700',
    icon: <Briefcase className="h-3.5 w-3.5" />,
  },
  interviewing: {
    label: 'Interviewing',
    color: 'bg-yellow-100 text-yellow-700',
    icon: <MessageSquare className="h-3.5 w-3.5" />,
  },
  offered: {
    label: 'Offered',
    color: 'bg-green-100 text-green-700',
    icon: <Star className="h-3.5 w-3.5" />,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
};

const STATUS_ORDER: ApplicationStatus[] = ['saved', 'applied', 'interviewing', 'offered', 'rejected'];

export default function ApplicationTracker({ applications, onStatusChange }: ApplicationTrackerProps) {
  const counts = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = applications.filter((a) => a.status === status).length;
      return acc;
    },
    {} as Record<ApplicationStatus, number>,
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">Application Tracker</h3>
      </div>

      {/* Summary counts */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {STATUS_ORDER.filter((s) => s !== 'rejected').map((status) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <div key={status} className="text-center p-2 rounded-lg bg-gray-50">
              <div className="text-xl font-bold text-gray-900">{counts[status]}</div>
              <div className="text-xs text-gray-500 mt-0.5">{cfg.label}</div>
            </div>
          );
        })}
      </div>

      {/* Application list */}
      {applications.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          Save or apply to jobs to track them here.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {applications.map((app) => {
            const cfg = STATUS_CONFIG[app.status];
            return (
              <div
                key={app.id}
                className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{app.job.title}</p>
                  <p className="text-xs text-gray-500 truncate">{app.job.company}</p>
                </div>
                {onStatusChange ? (
                  <select
                    value={app.status}
                    onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                    className="text-xs border border-gray-200 rounded px-1.5 py-1 text-gray-700 focus:outline-none focus:border-indigo-400"
                  >
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_CONFIG[s].label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={clsx('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium', cfg.color)}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
