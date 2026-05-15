import { TrendingUp, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import type { SkillsGapReport, SkillGapItem } from '../types';

interface SkillsGapCardProps {
  report: SkillsGapReport;
  isLoading?: boolean;
}

function PriorityBadge({ priority }: { priority: SkillGapItem['priority'] }) {
  const styles = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded', styles[priority])}>
      {priority}
    </span>
  );
}

export default function SkillsGapCard({ report, isLoading = false }: SkillsGapCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900">Skills Gap Analysis</h3>
      </div>

      <p className="text-sm text-gray-600 mb-4">{report.summary}</p>

      {report.top_missing_skills.length === 0 ? (
        <p className="text-sm text-green-600">No significant gaps detected!</p>
      ) : (
        <ul className="space-y-3">
          {report.top_missing_skills.map((item) => (
            <li key={item.skill} className="flex items-start gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{item.skill}</span>
                  <PriorityBadge priority={item.priority} />
                  <span className="text-xs text-gray-400 ml-auto">×{item.frequency} jobs</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{item.reason}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {report.recommended_resources.length > 0 && (
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Recommended Resources
            </p>
          </div>
          <ul className="space-y-1">
            {report.recommended_resources.map((resource, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                <span className="text-indigo-400 mt-0.5">›</span>
                {resource}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
