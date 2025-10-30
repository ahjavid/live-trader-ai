import React from 'react';
import { TraderStatus } from '../types';
import StatusIndicator from './StatusIndicator';

interface ControlPanelProps {
  status: TraderStatus;
  onStart: () => void;
  onStop: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ status, onStart, onStop, onRefresh, isLoading }) => {
  const isLive = status === TraderStatus.LIVE;
  
  return (
    <div className="bg-brand-surface p-4 rounded-lg shadow-lg ring-1 ring-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
      <StatusIndicator status={status} />
      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-full bg-brand-secondary hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-opacity-50"
          aria-label="Refresh Status"
        >
          <svg className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h5M20 20v-5h-5M20 4h-5v5M4 20h5v-5"></path></svg>
        </button>
        <button
          onClick={onStart}
          disabled={isLive || isLoading}
          className="px-6 py-2 font-semibold text-white bg-brand-success rounded-md shadow-sm hover:bg-green-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading && !isLive ? 'Loading...' : 'Start'}
        </button>
        <button
          onClick={onStop}
          disabled={!isLive || isLoading}
          className="px-6 py-2 font-semibold text-white bg-brand-danger rounded-md shadow-sm hover:bg-red-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading && isLive ? 'Stopping...' : 'Stop'}
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;