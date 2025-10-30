import React from 'react';
import { ModelState } from '../types';

interface LastModelStateProps {
  modelState: ModelState | null;
}

const InfoRow: React.FC<{ label: string; value: string | number; valueColor?: string }> = ({ label, value, valueColor = 'text-brand-text' }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-brand-text-secondary">{label}</span>
        <span className={`font-semibold ${valueColor}`}>{value}</span>
    </div>
);

const LastModelState: React.FC<LastModelStateProps> = ({ modelState }) => {
  const formatPercentage = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(value);

  const renderContent = () => {
    if (!modelState || !modelState.lastPrediction) {
      return <p className="text-sm text-brand-text-secondary text-center py-4">Awaiting first model state...</p>;
    }

    const { lastPrediction, timestamp } = modelState;
    const { actionType, confidence, expectedReturn, riskScore } = lastPrediction;

    const actionColor = actionType.includes('BUY') ? 'text-green-400' : actionType.includes('SELL') ? 'text-red-400' : 'text-gray-400';
    const confidenceColor = confidence > 0.75 ? 'text-brand-success' : confidence > 0.5 ? 'text-yellow-400' : 'text-brand-danger';
    const returnColor = expectedReturn >= 0 ? 'text-brand-success' : 'text-brand-danger';

    return (
      <div className="space-y-3">
        <InfoRow label="Last Action" value={actionType} valueColor={actionColor} />
        <InfoRow label="Confidence" value={formatPercentage(confidence)} valueColor={confidenceColor} />
        <InfoRow label="Expected Return" value={formatPercentage(expectedReturn)} valueColor={returnColor} />
        <InfoRow label="Risk Score" value={riskScore.toFixed(2)} />
        <p className="text-xs text-center text-gray-500 pt-2">
            Last updated: {new Date(timestamp).toLocaleTimeString()}
        </p>
      </div>
    );
  };
  
  return (
    <div>
        <h3 className="text-lg font-medium text-brand-text-secondary mb-4">Last Model State</h3>
        {renderContent()}
    </div>
  );
};

export default LastModelState;