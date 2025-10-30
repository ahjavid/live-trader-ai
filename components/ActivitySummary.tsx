import React from 'react';
import { ActivitySummary as ActivitySummaryType } from '../types';

interface StatCardProps {
  label: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div className="bg-brand-secondary p-4 rounded-lg text-center ring-1 ring-white/10">
    <dt className="text-sm font-medium text-brand-text-secondary truncate">{label}</dt>
    <dd className="mt-1 text-xl lg:text-2xl font-semibold text-brand-text">{value}</dd>
  </div>
);

interface ActivitySummaryProps {
  summary: ActivitySummaryType;
}

const ActivitySummary: React.FC<ActivitySummaryProps> = ({ summary }) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-brand-text-secondary mb-3">Bot Activity</h3>
      <dl className="grid grid-cols-3 gap-4">
        <StatCard label="Decisions" value={summary.totalDecisionPoints.toLocaleString()} />
        <StatCard label="Reconfirmations" value={summary.reconfirmations.toLocaleString()} />
        <StatCard label="Trades Executed" value={summary.tradesExecuted.toLocaleString()} />
      </dl>
    </div>
  );
};

export default ActivitySummary;