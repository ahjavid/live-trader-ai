import React, { useMemo } from 'react';
import { PerformanceData, Trade } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Embedded EquityCurveChart Component ---

interface EquityCurveChartProps {
  trades: Trade[];
  finalBalance: number;
}

interface ChartDataPoint {
  date: string;
  balance: number;
}

const EquityCurveChart: React.FC<EquityCurveChartProps> = ({ trades, finalBalance }) => {
  const chartData = useMemo(() => {
    if (trades.length === 0) {
      return [];
    }
    
    const sortedTrades = [...trades].sort((a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime());

    const totalPnl = sortedTrades.reduce((acc, trade) => acc + trade.pnl, 0);
    const initialBalance = finalBalance - totalPnl;

    const dataPoints: ChartDataPoint[] = sortedTrades.length > 0 ? [{
        date: sortedTrades[0].entryDate,
        balance: initialBalance
    }] : [];
    
    let runningBalance = initialBalance;
    sortedTrades.forEach(trade => {
        runningBalance += trade.pnl;
        dataPoints.push({
            date: trade.exitDate,
            balance: runningBalance,
        });
    });

    return dataPoints;
  }, [trades, finalBalance]);

  if (chartData.length === 0) {
    return (
      <div className="text-center h-full flex flex-col justify-center items-center">
        <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-brand-text-secondary">Not Enough Data for Chart</h3>
        <p className="mt-1 text-sm text-gray-500">The equity curve will be displayed once trades are completed.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
       <h3 className="text-lg font-medium text-brand-text-secondary mb-4 flex-shrink-0 px-2">Equity Curve</h3>
       <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4299e1" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#4299e1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis 
              dataKey="date" 
              stroke="#a0aec0" 
              tick={{ fontSize: 12 }} 
              tickFormatter={(str) => new Date(str).toLocaleDateString()} 
            />
            <YAxis 
              stroke="#a0aec0" 
              tick={{ fontSize: 12 }} 
              domain={['dataMin - 100', 'dataMax + 100']} 
              tickFormatter={(value) => `$${Number(value).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#2d3748', border: '1px solid #4a5568', color: '#e2e8f0' }} 
              labelStyle={{ color: '#a0aec0', marginBottom: '8px' }}
              labelFormatter={(label) => new Date(label).toLocaleString()}
              formatter={(value: number) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), 'Balance']}
            />
            <Area type="monotone" dataKey="balance" stroke="#4299e1" fillOpacity={1} fill="url(#colorBalance)" />
          </AreaChart>
        </ResponsiveContainer>
       </div>
    </div>
  );
};


// --- PerformanceDashboard Component ---

interface StatCardProps {
  label: string;
  value: string;
  valueColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, valueColor = 'text-brand-text' }) => (
  <div className="bg-brand-surface p-6 rounded-lg shadow-lg text-center flex flex-col justify-center ring-1 ring-white/10">
    <dt className="text-sm font-medium text-brand-text-secondary truncate">{label}</dt>
    <dd className={`mt-1 text-3xl font-semibold tracking-tight ${valueColor}`}>{value}</dd>
  </div>
);

interface PerformanceDashboardProps {
  data: PerformanceData | null;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ data }) => {
  // Show actual metrics if available, otherwise show loading/empty state
  if (!data || !data.metrics) {
    return (
      <div className="text-center py-16">
        <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11V9a4 4 0 014-4h.01M15 11V9a4 4 0 00-4-4h-2" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-brand-text-secondary">Loading Performance Data...</h3>
        <p className="mt-1 text-sm text-gray-500">Performance metrics will display when available.</p>
        <p className="mt-1 text-sm text-gray-500">Check the Dashboard tab to see your current portfolio.</p>
      </div>
    );
  }

  const { metrics, trades } = data;

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatPercentage = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);
  const formatNumber = (value: number, digits = 2) => new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  
  const returnColor = metrics.totalReturn >= 0 ? 'text-brand-success' : 'text-brand-danger';

  return (
    <div className="space-y-8">
        <div className="bg-brand-surface rounded-lg shadow-xl ring-1 ring-white/10 p-4 h-96">
            <EquityCurveChart trades={trades} finalBalance={metrics.finalBalance} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard 
                label="Total Return" 
                value={formatPercentage(metrics.totalReturn)}
                valueColor={returnColor}
            />
            <StatCard 
                label="Final Balance" 
                value={formatCurrency(metrics.finalBalance)} 
            />
            <StatCard 
                label="Sharpe Ratio" 
                value={formatNumber(metrics.sharpeRatio)} 
            />
            <StatCard 
                label="Max Drawdown" 
                value={formatPercentage(metrics.maxDrawdown)}
                valueColor="text-brand-danger"
            />
            <StatCard 
                label="Win Rate" 
                value={formatPercentage(metrics.winRate)}
                valueColor="text-brand-success"
            />
            <StatCard 
                label="Total Trades" 
                value={metrics.numTrades.toLocaleString()} 
            />
        </div>
    </div>
  );
};

export default PerformanceDashboard;
