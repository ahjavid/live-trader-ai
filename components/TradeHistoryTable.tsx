import React from 'react';
import { Trade } from '../types';

interface TradeHistoryTableProps {
  trades: Trade[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
};

const TradeRow: React.FC<{ trade: Trade }> = ({ trade }) => {
    const isProfit = trade.pnl >= 0;
    const pnlColor = isProfit ? 'text-brand-success' : 'text-brand-danger';
    const isClosed = trade.exitDate !== undefined;

    return (
        <tr className="hover:bg-brand-secondary transition-colors duration-150">
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-brand-text">{trade.symbol}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">{formatDate(trade.entryDate)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-brand-text-secondary">
                {isClosed ? formatDate(trade.exitDate!) : <span className="text-yellow-500">Open</span>}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-brand-text">{trade.quantity.toFixed(4)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-brand-text-secondary">{formatCurrency(trade.entryPrice)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-brand-text">
                {trade.exitPrice !== undefined ? formatCurrency(trade.exitPrice) : '-'}
            </td>
            {/* FIX: Corrected a syntax error in className by using a template literal for dynamic classes. */}
            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${pnlColor}`}>
                {isClosed ? formatCurrency(trade.pnl) : '-'}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-brand-text-secondary">{formatCurrency(trade.fees)}</td>
        </tr>
    );
};


const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({ trades }) => {
  if (trades.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-brand-text-secondary">No Trade History Available</h3>
        <p className="mt-1 text-sm text-gray-500">Trade history is not available in the current backend implementation.</p>
        <p className="mt-1 text-sm text-gray-500">Check the Dashboard tab to see your current active positions.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-brand-secondary">
        <thead className="bg-gray-800">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Symbol</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Entry Date</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Exit Date</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Quantity</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Entry Price</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Exit Price</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">P/L ($)</th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Fees ($)</th>
          </tr>
        </thead>
        <tbody className="bg-brand-surface divide-y divide-brand-secondary">
          {trades.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TradeHistoryTable;
