import React, { useState, FormEvent } from 'react';
import { StartTraderPayload, TraderConfig } from '../types';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (payload: StartTraderPayload) => void;
  isLoading: boolean;
}

// Top performing symbols (>20% return) based on backtesting
const SYMBOL_PRESETS = {
  'Top 5 Elite': 'NEM,ORCL,AVGO,NVDA,ABBV',
  'Top 10 Performers': 'NEM,ORCL,AVGO,NVDA,ABBV,C,GOOGL,GS,PFE,CAT',
  'Diversified 15': 'NEM,ORCL,AVGO,NVDA,GOOGL,GS,CAT,JNJ,NOW,MU,PM,BX,BA,MSFT,AMD',
  'All Top 24': 'NEM,ORCL,AVGO,NVDA,ABBV,C,GOOGL,GS,PFE,CAT,JNJ,NOW,MU,UBER,PM,BX,UNH,AXP,BA,GE,AMD,MSFT,T,DIS',
  'Tech Focus': 'NVDA,AVGO,GOOGL,NOW,MU,AMD,MSFT,ORCL',
  'Finance & Industrials': 'GS,C,AXP,BX,CAT,BA,GE',
  'Healthcare & Consumer': 'ABBV,PFE,JNJ,UNH,PM,DIS',
  'Custom': ''
};

// Flatten the config for easier state management in the form
const initialFormState = {
  preset: 'Top 5 Elite',
  symbols: SYMBOL_PRESETS['Top 5 Elite'],
  initial_balance: 10000,
  min_confidence: 0.6,
  max_risk: 0.8,
  max_position: 1.0,
  max_risk_per_trade: 0.02,
  max_positions: 5,
  max_drawdown: 0.05,
  position_limit: 25000,
  risk_multiplier: 0.5,
  stop_loss: 0.02,
  take_profit: 0.03,
};

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, onStart, isLoading }) => {
  const [formState, setFormState] = useState(initialFormState);

  if (!isOpen) return null;

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = e.target.value as keyof typeof SYMBOL_PRESETS;
    setFormState((prev) => ({
      ...prev,
      preset,
      symbols: SYMBOL_PRESETS[preset],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
      // If user manually edits symbols, switch to Custom preset
      ...(name === 'symbols' ? { preset: 'Custom' } : {}),
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const { symbols: symbolsString, ...configValues } = formState;
    const symbols = symbolsString.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    
    if (symbols.length === 0) {
        alert("Please enter at least one symbol.");
        return;
    }

    // Clean up empty strings from number inputs before submitting
    const config: TraderConfig = {};
    for (const [key, value] of Object.entries(configValues)) {
        if (value != null && String(value) !== '') {
            config[key as keyof TraderConfig] = Number(value);
        }
    }

    onStart({ symbols, config });
  };
  
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity"
      onClick={handleOverlayClick}
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-brand-surface rounded-lg shadow-2xl p-6 md:p-8 w-full max-w-3xl m-4 max-h-[90vh] overflow-y-auto ring-1 ring-white/10">
        <h2 className="text-2xl font-bold mb-4 text-brand-text">Trader Configuration</h2>
        <p className="text-brand-text-secondary mb-6">Define the parameters for your live trading session.</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* --- Core Parameters --- */}
          <fieldset>
            <legend className="text-lg font-medium text-brand-primary mb-3">Core Parameters</legend>
            <div className="space-y-4">
              <div>
                <label htmlFor="preset" className="block text-sm font-medium text-brand-text-secondary">Symbol Preset (Top Performers)</label>
                <select 
                  name="preset" 
                  id="preset" 
                  value={formState.preset} 
                  onChange={handlePresetChange}
                  className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2"
                >
                  {Object.keys(SYMBOL_PRESETS).map((preset) => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="symbols" className="block text-sm font-medium text-brand-text-secondary">
                  Symbols (comma-separated)
                  {formState.preset !== 'Custom' && (
                    <span className="ml-2 text-xs text-brand-text-tertiary">
                      {formState.symbols.split(',').length} symbols selected
                    </span>
                  )}
                </label>
                <input 
                  type="text" 
                  name="symbols" 
                  id="symbols" 
                  value={formState.symbols} 
                  onChange={handleChange} 
                  required 
                  placeholder={formState.preset === 'Custom' ? 'Enter symbols (e.g., AAPL,GOOGL,MSFT)' : ''}
                  className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="initial_balance" className="block text-sm font-medium text-brand-text-secondary">Initial Balance ($)</label>
                    <input type="number" name="initial_balance" id="initial_balance" value={formState.initial_balance} onChange={handleChange} step="1000" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                  </div>
                 <div>
                    <label htmlFor="max_positions" className="block text-sm font-medium text-brand-text-secondary">Max Simultaneous Positions</label>
                    <input type="number" name="max_positions" id="max_positions" value={formState.max_positions} onChange={handleChange} step="1" min="1" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                  </div>
              </div>
            </div>
          </fieldset>
          
          {/* --- Risk Management --- */}
          <fieldset>
            <legend className="text-lg font-medium text-brand-primary mb-3">Risk Management</legend>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="min_confidence" className="block text-sm font-medium text-brand-text-secondary">Min Confidence</label>
                  <input type="number" name="min_confidence" id="min_confidence" value={formState.min_confidence} onChange={handleChange} step="0.05" min="0" max="1" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                </div>
                <div>
                  <label htmlFor="max_risk" className="block text-sm font-medium text-brand-text-secondary">Max Portfolio Risk</label>
                  <input type="number" name="max_risk" id="max_risk" value={formState.max_risk} onChange={handleChange} step="0.05" min="0" max="1" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                </div>
                <div>
                  <label htmlFor="max_position" className="block text-sm font-medium text-brand-text-secondary">Max Position Size (%)</label>
                  <input type="number" name="max_position" id="max_position" value={formState.max_position} onChange={handleChange} step="0.1" min="0" max="1" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                </div>
                <div>
                  <label htmlFor="position_limit" className="block text-sm font-medium text-brand-text-secondary">Position Limit ($)</label>
                  <input type="number" name="position_limit" id="position_limit" value={formState.position_limit} onChange={handleChange} step="100" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                </div>
                <div>
                  <label htmlFor="max_drawdown" className="block text-sm font-medium text-brand-text-secondary">Max Drawdown (%)</label>
                  <input type="number" name="max_drawdown" id="max_drawdown" value={formState.max_drawdown} onChange={handleChange} step="0.01" min="0" max="1" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                </div>
                <div>
                  <label htmlFor="stop_loss" className="block text-sm font-medium text-brand-text-secondary">Stop Loss (%)</label>
                  <input type="number" name="stop_loss" id="stop_loss" value={formState.stop_loss} onChange={handleChange} step="0.01" min="0" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                </div>
                <div>
                  <label htmlFor="take_profit" className="block text-sm font-medium text-brand-text-secondary">Take Profit (%)</label>
                  <input type="number" name="take_profit" id="take_profit" value={formState.take_profit} onChange={handleChange} step="0.01" min="0" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                </div>
                <div>
                  <label htmlFor="risk_multiplier" className="block text-sm font-medium text-brand-text-secondary">Risk Multiplier</label>
                  <input type="number" name="risk_multiplier" id="risk_multiplier" value={formState.risk_multiplier} onChange={handleChange} step="0.1" min="0" max="1" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                </div>
                 <div>
                  <label htmlFor="max_risk_per_trade" className="block text-sm font-medium text-brand-text-secondary">Risk Per Trade (%)</label>
                  <input type="number" name="max_risk_per_trade" id="max_risk_per_trade" value={formState.max_risk_per_trade} onChange={handleChange} step="0.01" min="0" className="mt-1 block w-full bg-brand-secondary border-transparent rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2" />
                </div>
            </div>
          </fieldset>
          
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-md bg-brand-secondary hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface focus:ring-brand-primary disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="px-6 py-2 text-sm font-medium text-white rounded-md bg-brand-success hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-surface focus:ring-brand-primary disabled:bg-gray-500">
              {isLoading ? 'Starting...' : 'Start Trading'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigModal;