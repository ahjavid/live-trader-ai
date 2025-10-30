import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Position } from '../types';

interface PriceChartProps {
  positions: Position[];
}

interface ChartDataPoint {
  time: string;
  price: number;
}

const MAX_DATA_POINTS = 100;

const PriceChart: React.FC<PriceChartProps> = ({ positions }) => {
  const [chartData, setChartData] = useState<{ [key: string]: ChartDataPoint[] }>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const symbols = useMemo(() => positions.map(p => p.symbol), [positions]);

  useEffect(() => {
    // If there's no selected symbol or the current one is no longer active, select the first available symbol.
    if (!selectedSymbol || !symbols.includes(selectedSymbol)) {
      setSelectedSymbol(symbols.length > 0 ? symbols[0] : null);
    }
  }, [symbols, selectedSymbol]);
  
  useEffect(() => {
    if (positions.length > 0) {
      const now = new Date();
      const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit'});

      setChartData(prevData => {
        const newData = { ...prevData };
        
        positions.forEach(position => {
          const symbolData = newData[position.symbol] || [];
          const newPoint = { time: timeLabel, price: position.currentPrice };
          
          const updatedSymbolData = [...symbolData, newPoint];
          
          // Limit the number of data points to avoid performance issues
          if (updatedSymbolData.length > MAX_DATA_POINTS) {
            updatedSymbolData.shift();
          }
          
          newData[position.symbol] = updatedSymbolData;
        });

        // Clean up data for symbols that are no longer in positions
        Object.keys(newData).forEach(symbol => {
          if (!positions.some(p => p.symbol === symbol)) {
            delete newData[symbol];
          }
        });

        return newData;
      });
    } else {
        // If there are no positions, clear all chart data
        setChartData({});
    }
  }, [positions]);

  if (positions.length === 0) {
    return (
      <div className="text-center py-16 h-full flex flex-col justify-center items-center">
        <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-brand-text-secondary">No Price Data Available</h3>
        <p className="mt-1 text-sm text-gray-500">Start the trader to see real-time price charts.</p>
      </div>
    );
  }
  
  const selectedData = selectedSymbol ? chartData[selectedSymbol] : [];

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-shrink-0 mb-4 px-2">
        <label htmlFor="symbol-select" className="sr-only">Select Symbol</label>
        <select
          id="symbol-select"
          value={selectedSymbol || ''}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="w-full bg-brand-secondary border-brand-secondary rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary text-brand-text p-2 text-sm"
        >
          {symbols.map(symbol => (
            <option key={symbol} value={symbol}>{symbol} Price Chart</option>
          ))}
        </select>
      </div>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={selectedData}
            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey="time" stroke="#a0aec0" tick={{ fontSize: 12 }} />
            <YAxis stroke="#a0aec0" tick={{ fontSize: 12 }} domain={['dataMin - 1', 'dataMax + 1']} tickFormatter={(value) => `$${Number(value).toFixed(2)}`} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#2d3748', 
                border: '1px solid #4a5568',
                color: '#e2e8f0'
              }} 
              labelStyle={{ color: '#a0aec0' }}
              formatter={(value: number) => [new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value), 'Price']}
            />
            <Legend wrapperStyle={{ fontSize: '14px' }} />
            <Line type="monotone" dataKey="price" stroke="#4299e1" strokeWidth={2} dot={false} name={selectedSymbol || 'Price'} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;
