import React from 'react';
import { PortfolioSummary as PortfolioSummaryType } from '../types';

interface StatCardProps {
  label: string;
  value: string;
  valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, valueColor = 'text-brand-text' }) => (
  <div className="bg-brand-secondary p-4 rounded-lg text-center ring-1 ring-white/10">
    <dt className="text-sm font-medium text-brand-text-secondary truncate">{label}</dt>
    <dd className={`mt-1 text-xl lg:text-2xl font-semibold ${valueColor}`}>{value}</dd>
  </div>
);

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
}

const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ summary }) => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatPercentage = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const pnlColor = (value: number) => (value >= 0 ? 'text-brand-success' : 'text-brand-danger');
  const drawdownColor = summary.drawdown > 0.05 ? 'text-brand-danger' : 'text-brand-success';
  const winRateColor = summary.winRate >= 0.5 ? 'text-brand-success' : 'text-brand-danger';

  return (
    <div>
      <h3 className="text-lg font-medium text-brand-text-secondary mb-3">Portfolio Overview</h3>
      <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Portfolio Value" value={formatCurrency(summary.portfolioValue)} />
        <StatCard label="Available Cash" value={formatCurrency(summary.balance)} />
        <StatCard label="Daily P/L" value={formatCurrency(summary.dailyPnl)} valueColor={pnlColor(summary.dailyPnl)} />
        <StatCard label="Total P/L" value={formatCurrency(summary.totalPnl)} valueColor={pnlColor(summary.totalPnl)} />
        <StatCard label="Drawdown" value={formatPercentage(summary.drawdown)} valueColor={drawdownColor} />
        <StatCard label="Win Rate" value={formatPercentage(summary.winRate)} valueColor={winRateColor} />
        <StatCard label="Trades" value={summary.tradeCount.toLocaleString()} />
      </dl>
    </div>
  );
};

export default PortfolioSummary;