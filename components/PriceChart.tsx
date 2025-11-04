import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Position } from '../types';

interface PriceChartProps {
  positions: Position[];
}

interface ChartDataPoint {
  time: string;
  timestamp: number; // Unix timestamp for better time handling
  price: number;
}

// With 5-minute intervals, keep more data points for better chart history
// 288 points = 24 hours of data (288 * 5 minutes = 1440 minutes = 24 hours)
const MAX_DATA_POINTS = 288;
const UPDATE_INTERVAL = 300000; // 5 minutes in milliseconds
const MIN_TIME_DIFF = 60000; // 1 minute threshold to prevent duplicates

const PriceChart: React.FC<PriceChartProps> = ({ positions }) => {
  const [chartData, setChartData] = useState<{ [key: string]: ChartDataPoint[] }>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // Memoize symbols array to prevent unnecessary recalculations
  const symbols = useMemo(() => positions.map(p => p.symbol), [positions]);

  // Auto-select first symbol when available
  useEffect(() => {
    if (!selectedSymbol || !symbols.includes(selectedSymbol)) {
      setSelectedSymbol(symbols.length > 0 ? symbols[0] : null);
    }
  }, [symbols, selectedSymbol]);

  // Memoize symbols string for stable dependency checking
  const symbolsKey = useMemo(() => symbols.join(','), [symbols]);

  // Fetch real-time prices - memoized to prevent recreation
  const fetchRealTimePrices = useCallback(async () => {
    if (symbols.length === 0) return;

    const prices: { [key: string]: number } = {};
    
    // Fetch all prices in parallel for better performance
    await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const response = await fetch(`/api/market/price/${symbol}`, {
            headers: {
              'X-API-Key': import.meta.env.VITE_API_KEY || '',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            prices[symbol] = data.price;
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${symbol}:`, error);
        }
      })
    );
    
    // Update chart data with new prices using functional state update
    const now = new Date();
    const timestamp = now.getTime();
    const timeLabel = now.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    setChartData(prevData => {
      const newData = { ...prevData };
      
      // Update prices for all symbols that were fetched
      symbols.forEach(symbol => {
        if (prices[symbol] === undefined) return;
        
        const symbolData = newData[symbol] || [];
        const currentPrice = prices[symbol];
        
        // Prevent duplicate timestamps - only add if enough time has passed
        const lastPoint = symbolData[symbolData.length - 1];
        const shouldAddPoint = !lastPoint || (timestamp - lastPoint.timestamp) >= MIN_TIME_DIFF;
        
        if (shouldAddPoint) {
          const newPoint: ChartDataPoint = { time: timeLabel, timestamp, price: currentPrice };
          const updatedSymbolData = [...symbolData, newPoint];
          
          // Keep only MAX_DATA_POINTS for performance
          if (updatedSymbolData.length > MAX_DATA_POINTS) {
            updatedSymbolData.shift();
          }
          
          newData[symbol] = updatedSymbolData;
        } else if (lastPoint) {
          // Update existing point's price if within same minute
          lastPoint.price = currentPrice;
          newData[symbol] = symbolData;
        }
      });

      // Clean up data for symbols no longer being tracked
      Object.keys(newData).forEach(symbol => {
        if (!symbols.includes(symbol)) {
          delete newData[symbol];
        }
      });

      return newData;
    });
  }, [symbolsKey, symbols]); // Depend on symbolsKey for stable reference
  
  // Effect for fetching prices on interval
  useEffect(() => {
    if (symbols.length === 0) {
      setChartData({});
      return;
    }

    // Fetch immediately on mount or when symbols change
    fetchRealTimePrices();
    
    // Fetch prices every 5 minutes (backend has Redis cache)
    const interval = setInterval(fetchRealTimePrices, UPDATE_INTERVAL);
    
    return () => clearInterval(interval);
  }, [fetchRealTimePrices, symbols.length]); // Stable fetchRealTimePrices reference

  // Memoize selected chart data to prevent unnecessary recalculations
  const selectedData = useMemo(() => {
    return selectedSymbol ? chartData[selectedSymbol] || [] : [];
  }, [selectedSymbol, chartData]);

  // Empty state when no positions
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
            margin={{ top: 5, right: 20, left: -10, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis 
              dataKey="time" 
              stroke="#a0aec0" 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#a0aec0" 
              tick={{ fontSize: 12 }} 
              domain={['dataMin - 1', 'dataMax + 1']} 
              tickFormatter={(value) => `$${Number(value).toFixed(2)}`}
              width={60}
            />
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
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#4299e1" 
              strokeWidth={2} 
              dot={false}
              name={selectedSymbol || 'Price'}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceChart;