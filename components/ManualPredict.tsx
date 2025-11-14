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

    const { actionType, confidence, expectedReturn, riskScore, positionSize, metadata, volatility, turbulenceLevel, riskFactors, approved, rejectionReason } = prediction;
    const actionColor = actionType === 'LONG' ? 'text-green-400' : actionType === 'SHORT' ? 'text-red-400' : 'text-gray-400';
    const confidenceColor = confidence > 0.75 ? 'text-brand-success' : confidence > 0.5 ? 'text-yellow-400' : 'text-brand-danger';
    const returnColor = expectedReturn >= 0 ? 'text-brand-success' : 'text-brand-danger';
    
    const formatCurrency = (value: number | null | undefined) => {
      if (value === null || value === undefined) return 'N/A';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    };

    const getRiskLevelColor = (level?: string) => {
      if (!level) return 'text-brand-text';
      const lower = level.toLowerCase();
      if (lower.includes('low')) return 'text-green-400';
      if (lower.includes('moderate')) return 'text-yellow-400';
      if (lower.includes('high')) return 'text-orange-400';
      if (lower.includes('very_high')) return 'text-red-400';
      return 'text-brand-text';
    };

    const getRegimeColor = (regime?: string) => {
      if (!regime) return 'text-brand-text';
      if (regime === 'bull') return 'text-green-400';
      if (regime === 'bear') return 'text-red-400';
      if (regime === 'sideways') return 'text-yellow-400';
      return 'text-brand-text';
    };

    const getTurbulenceColor = (level?: string) => {
      if (!level) return 'text-brand-text';
      const lower = level.toLowerCase();
      if (lower === 'normal') return 'text-green-400';
      if (lower === 'elevated') return 'text-yellow-400';
      if (lower === 'high') return 'text-orange-400';
      if (lower === 'extreme') return 'text-red-400';
      return 'text-brand-text';
    };
    
    return (
        <div className="mt-4 space-y-2 animate-fade-in">
            {/* Core Decision */}
            <div className="border-b-2 border-brand-primary pb-2 mb-2">
              <InfoRow label="Action" value={actionType} valueColor={actionColor} />
              <InfoRow label="Position Size" value={formatPercentage(positionSize)} />
              {approved !== undefined && (
                <InfoRow 
                  label="Decision Approved" 
                  value={approved ? 'YES' : 'NO'} 
                  valueColor={approved ? 'text-green-400' : 'text-red-400'} 
                />
              )}
              {rejectionReason && (
                <div className="mt-1 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300">
                  <strong>Rejected:</strong> {rejectionReason}
                </div>
              )}
            </div>

            {/* Model Confidence & Risk */}
            <InfoRow label="Confidence" value={formatPercentage(confidence)} valueColor={confidenceColor} />
            <InfoRow label="Expected Return" value={formatPercentage(expectedReturn)} valueColor={returnColor} />
            {metadata?.kelly_fraction !== undefined && (
              <InfoRow label="Kelly Fraction" value={formatPercentage(metadata.kelly_fraction)} />
            )}

            {/* Market Context */}
            {(metadata?.regime || metadata?.market_condition || metadata?.risk_level || turbulenceLevel || volatility) && (
              <div className="border-t border-brand-secondary pt-2 mt-2">
                {metadata?.regime && (
                  <InfoRow label="Regime" value={metadata.regime.toUpperCase()} valueColor={getRegimeColor(metadata.regime)} />
                )}
                {turbulenceLevel && (
                  <InfoRow label="Turbulence" value={turbulenceLevel.toUpperCase()} valueColor={getTurbulenceColor(turbulenceLevel)} />
                )}
                {metadata?.market_condition && (
                  <InfoRow label="Market Condition" value={metadata.market_condition.replace(/_/g, ' ').toUpperCase()} />
                )}
                {metadata?.risk_level && (
                  <InfoRow label="Risk Level" value={metadata.risk_level.replace(/_/g, ' ').toUpperCase()} valueColor={getRiskLevelColor(metadata.risk_level)} />
                )}
                {volatility !== undefined && (
                  <InfoRow label="Volatility" value={formatPercentage(volatility)} />
                )}
              </div>
            )}

            {/* Risk Factors */}
            {riskFactors && (
              <div className="border-t border-brand-secondary pt-2 mt-2">
                <div className="text-xs font-semibold text-brand-text-secondary mb-1">Risk Factors:</div>
                {riskFactors.volatility_regime && (
                  <InfoRow label="Vol Regime" value={riskFactors.volatility_regime.toUpperCase()} />
                )}
                {riskFactors.trend_strength !== undefined && (
                  <InfoRow label="Trend Strength" value={formatPercentage(riskFactors.trend_strength)} />
                )}
                {riskFactors.liquidity_score !== undefined && (
                  <InfoRow label="Liquidity Score" value={formatPercentage(riskFactors.liquidity_score)} />
                )}
              </div>
            )}

            {/* Price Targets */}
            {(metadata?.current_price || metadata?.stop_loss || metadata?.take_profit) && (
              <div className="border-t border-brand-secondary pt-2 mt-2">
                {metadata.current_price !== undefined && (
                  <InfoRow label="Current Price" value={formatCurrency(metadata.current_price)} />
                )}
                {metadata.stop_loss && (
                  <InfoRow label="Stop Loss" value={formatCurrency(metadata.stop_loss)} valueColor="text-red-400" />
                )}
                {metadata.take_profit && (
                  <InfoRow label="Take Profit" value={formatCurrency(metadata.take_profit)} valueColor="text-green-400" />
                )}
                {metadata.target_2 && (
                  <InfoRow label="Target 2" value={formatCurrency(metadata.target_2)} valueColor="text-green-300" />
                )}
                {metadata.risk_reward_ratio !== undefined && (
                  <InfoRow label="Risk/Reward" value={metadata.risk_reward_ratio.toFixed(2)} />
                )}
              </div>
            )}
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