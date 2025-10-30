import React, { useState, FormEvent } from 'react';
import { Prediction } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface ManualPredictProps {
  prediction: Prediction | null;
  isLoading: boolean;
  onPredict: (symbol: string) => void;
}

const InfoRow: React.FC<{ label: string; value: string | number; valueColor?: string }> = ({ label, value, valueColor = 'text-brand-text' }) => (
    <div className="flex justify-between items-center text-sm py-1 border-b border-brand-secondary">
        <span className="text-brand-text-secondary">{label}</span>
        <span className={`font-semibold ${valueColor}`}>{value}</span>
    </div>
);

const ManualPredict: React.FC<ManualPredictProps> = ({ prediction, isLoading, onPredict }) => {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onPredict(symbol.trim().toUpperCase());
    }
  };
  
  const formatPercentage = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1 }).format(value);

  const renderResult = () => {
    if (isLoading) {
      return <div className="flex justify-center items-center h-24"><LoadingSpinner /></div>;
    }

    if (!prediction) {
      return <p className="text-sm text-center text-brand-text-secondary mt-4">Enter a symbol to get a prediction.</p>;
    }

    const { actionType, confidence, expectedReturn, riskScore, positionSize } = prediction;
    const actionColor = actionType.includes('BUY') ? 'text-green-400' : actionType.includes('SELL') ? 'text-red-400' : 'text-gray-400';
    const confidenceColor = confidence > 0.75 ? 'text-brand-success' : confidence > 0.5 ? 'text-yellow-400' : 'text-brand-danger';
    const returnColor = expectedReturn >= 0 ? 'text-brand-success' : 'text-brand-danger';
    
    return (
        <div className="mt-4 space-y-2 animate-fade-in">
            <InfoRow label="Action" value={actionType} valueColor={actionColor} />
            <InfoRow label="Confidence" value={formatPercentage(confidence)} valueColor={confidenceColor} />
            <InfoRow label="Position Size" value={formatPercentage(positionSize)} />
            <InfoRow label="Expected Return" value={formatPercentage(expectedReturn)} valueColor={returnColor} />
            <InfoRow label="Risk Score" value={riskScore.toFixed(2)} />
        </div>
    );
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-brand-text-secondary mb-4">Manual Predictor</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="e.g., AAPL"
          className="flex-grow bg-brand-secondary border-brand-secondary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2 text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !symbol.trim()}
          className="px-4 py-2 text-sm font-medium text-white rounded-md bg-brand-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface focus:ring-brand-primary disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? '...' : 'Predict'}
        </button>
      </form>

      {renderResult()}
    </div>
  );
};

export default ManualPredict;