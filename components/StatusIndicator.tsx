import React from 'react';
import { TraderStatus } from '../types';

interface StatusIndicatorProps {
  status: TraderStatus;
}

const statusConfig = {
  [TraderStatus.LIVE]: { text: 'Live', color: 'bg-green-500', pulse: true },
  [TraderStatus.STOPPED]: { text: 'Stopped', color: 'bg-red-500', pulse: false },
  [TraderStatus.PENDING]: { text: 'Pending...', color: 'bg-yellow-500', pulse: true },
};

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <div className="flex items-center space-x-3">
      <div className="relative flex items-center justify-center w-4 h-4">
        {config.pulse && (
          <div className={`absolute w-full h-full rounded-full ${config.color} opacity-75 animate-ping`}></div>
        )}
        <div className={`relative w-3 h-3 rounded-full ${config.color}`}></div>
      </div>
      <span className="text-lg font-medium tracking-wider uppercase">
        {config.text}
      </span>
    </div>
  );
};

export default StatusIndicator;
