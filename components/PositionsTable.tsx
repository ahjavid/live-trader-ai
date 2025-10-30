import React from 'react';
import { Position } from '../types';
import PositionRow from './PositionRow';

interface PositionsTableProps {
  positions: Position[];
}

const PositionsTable: React.FC<PositionsTableProps> = ({ positions }) => {
  const renderContent = () => {
    if (positions.length === 0) {
      return (
        <div className="text-center py-16 flex-grow flex flex-col items-center justify-center">
          <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-brand-text-secondary">No Active Positions</h3>
          <p className="mt-1 text-sm text-gray-500">When live, your positions will appear here.</p>
        </div>
      );
    }

    return (
      <div className="overflow-auto flex-grow">
        <table className="min-w-full divide-y divide-brand-secondary">
          <thead className="bg-gray-800 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Symbol</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Side</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Quantity</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Entry Price</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">Current Price</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-brand-text-secondary uppercase tracking-wider">P/L ($)</th>
            </tr>
          </thead>
          <tbody className="bg-brand-surface divide-y divide-brand-secondary">
            {positions.map((position) => (
              <PositionRow key={position.id} position={position} />
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-lg font-medium text-brand-text-secondary p-4 border-b border-brand-secondary flex-shrink-0">Active Positions</h3>
      {renderContent()}
    </div>
  );
};

export default PositionsTable;