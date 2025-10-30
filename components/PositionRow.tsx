import React from 'react';
import { Position, PositionSide } from '../types';

interface PositionRowProps {
  position: Position;
}

const PositionRow: React.FC<PositionRowProps> = ({ position }) => {
  const isProfit = position.pnl >= 0;
  const sideColor = position.side === PositionSide.BUY ? 'text-green-400' : 'text-red-400';
  const pnlColor = isProfit ? 'text-brand-success' : 'text-brand-danger';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <tr className="hover:bg-brand-secondary transition-colors duration-150">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-brand-text">{position.symbol}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`text-sm font-bold ${sideColor}`}>
          {position.side}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-brand-text">{position.quantity.toFixed(4)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-brand-text-secondary">{formatCurrency(position.entryPrice)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="text-sm text-brand-text">{formatCurrency(position.currentPrice)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className={`text-sm font-semibold ${pnlColor}`}>{formatCurrency(position.pnl)}</div>
      </td>
    </tr>
  );
};

export default PositionRow;
