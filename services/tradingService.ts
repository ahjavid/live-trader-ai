import {
  TraderStatus,
  Position,
  PositionSide,
  StartTraderPayload,
  ApiStatusResponse,
  ApiPosition,
  PortfolioSummary,
  ActivitySummary,
  Trade,
  ApiTrade,
  PerformanceMetrics,
  ApiPerformanceResponse,
  PerformanceData,
  Prediction,
  ApiPrediction,
  ModelState,
  ApiModelState
} from '../types';

const API_BASE_URL = ''; // Use a relative path to leverage the development proxy

const getHeaders = () => {
    console.log('🌍 All env vars:', import.meta.env);
    const apiKey = import.meta.env.VITE_API_KEY || '';
    console.log('🔑 API Key loaded:', apiKey ? `${apiKey.substring(0, 20)}...` : 'NOT FOUND');
    if (!apiKey) {
        console.warn('⚠️ API Key is not set. Please ensure the VITE_API_KEY environment variable is configured.');
        console.warn('⚠️ Available env keys:', Object.keys(import.meta.env));
    }
    return {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
    };
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText || 'No error details'}`);
    }
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return {};
};

const mapApiPositionToPosition = (symbol: string, apiPos: ApiPosition): Position => {
    const shares = apiPos.shares ?? apiPos.position_shares ?? 0;
    const entryPrice = apiPos.average_price ?? apiPos.entry_price_per_share ?? 0;
    return {
        id: symbol,
        symbol: symbol,
        side: shares >= 0 ? PositionSide.BUY : PositionSide.SELL,
        quantity: Math.abs(shares),
        entryPrice: entryPrice,
        currentPrice: apiPos.current_market_price,
        pnl: apiPos.unrealized_pnl,
    };
};

const mapApiStatusToSummary = (data: ApiStatusResponse): PortfolioSummary => ({
    portfolioValue: data.total_portfolio_value ?? data.portfolio_value ?? 0,
    unrealizedPnl: data.unrealized_pnl,
    realizedPnl: data.realized_pnl ?? 0, // Not in new spec, default to 0
    totalPnl: data.total_pnl,
    drawdown: data.drawdown,
    balance: data.balance ?? data.available_cash ?? 0,
    dailyPnl: data.daily_pnl,
    winRate: data.win_rate,
    tradeCount: data.trade_count,
});

const mapApiToActivitySummary = (data: ApiStatusResponse): ActivitySummary => ({
    totalDecisionPoints: data.activity_summary?.total_decision_points ?? 0,
    tradesExecuted: data.activity_summary?.trades_executed ?? 0,
});

const mapApiTradeToTrade = (apiTrade: ApiTrade, index: number): Trade => ({
  id: `${apiTrade.symbol}-${apiTrade.entry_date}-${index}`,
  symbol: apiTrade.symbol,
  entryDate: apiTrade.entry_date,
  exitDate: apiTrade.exit_date,
  quantity: apiTrade.position_size,
  entryPrice: apiTrade.entry_price,
  exitPrice: apiTrade.exit_price,
  pnl: apiTrade.pnl,
  fees: apiTrade.fees,
});

const mapApiToPerformanceMetrics = (data: ApiPerformanceResponse): PerformanceMetrics => ({
    totalReturn: data.total_return,
    sharpeRatio: data.sharpe_ratio,
    sortinoRatio: data.sortino_ratio,
    calmarRatio: data.calmar_ratio,
    maxDrawdown: data.max_drawdown,
    winRate: data.win_rate,
    numTrades: data.num_trades,
    closedTrades: data.num_trades, // For API responses, num_trades represents closed trades
    finalBalance: data.final_balance,
});

const mapApiToPrediction = (data: ApiPrediction): Prediction => ({
    actionType: data.action_type,
    positionSize: data.position_size,
    confidence: data.confidence,
    expectedReturn: data.expected_return,
    riskScore: data.risk_score,
});

// Cache for the last status response to avoid duplicate API calls
let cachedStatusResponse: any = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5000; // Cache for 5 seconds

const getCachedOrFetchStatus = async (): Promise<any> => {
    const now = Date.now();
    if (cachedStatusResponse && (now - cacheTimestamp) < CACHE_TTL) {
        console.log('Using cached status response');
        return cachedStatusResponse;
    }

    console.log('Fetching fresh status from API');
    const response = await fetch(`${API_BASE_URL}/api/v1/rl/live/status`, {
        method: 'GET',
        headers: getHeaders(),
    });

    if (!response.ok) {
        if (response.status === 429) {
            console.log('Rate limited, using stale cache if available');
            if (cachedStatusResponse) return cachedStatusResponse;
        }
        throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    cachedStatusResponse = data;
    cacheTimestamp = now;
    return data;
};

export const tradingService = {
  getFullStatus: async (): Promise<{ status: TraderStatus; positions: Position[]; summary: PortfolioSummary | null; activity: ActivitySummary | null }> => {
    try {
        const data = await getCachedOrFetchStatus();
        console.log('Status API response:', data);
        
        // Check if trading is actually running - backend returns status: "running" when live
        if (data.is_trading === true || data.status === "running" || data.status === "active") {
            // Extract positions from the actual backend structure
            // Backend returns: position_details.positions_by_symbol: [{ symbol, position_size_pct, shares, entry_price, current_price, ... }]
            const positionsArray = data.position_details?.positions_by_symbol || [];
            const positions = positionsArray.map((pos: any) => ({
                id: pos.symbol,
                symbol: pos.symbol,
                side: pos.direction === "LONG" ? PositionSide.BUY : PositionSide.SELL,
                quantity: pos.shares || 0,
                entryPrice: pos.entry_price || 0,
                currentPrice: pos.current_price || pos.entry_price || 0,
                pnl: pos.unrealized_pnl || 0,
            }));

            // Map the actual backend response to frontend summary structure
            const perfMetrics = data.performance_metrics || {};
            const posDetails = data.position_details || {};
            const totalPnl = posDetails.total_unrealized_pnl || 0;
            
            const summary: PortfolioSummary = {
                portfolioValue: posDetails.total_portfolio_value || data.current_balance || 0,
                unrealizedPnl: totalPnl,
                realizedPnl: data.total_pnl || 0,
                totalPnl: data.total_pnl || 0,
                drawdown: perfMetrics.max_drawdown || 0,
                balance: data.current_balance || 0,
                dailyPnl: totalPnl,
                winRate: data.win_rate || 0,
                tradeCount: data.total_trades || 0,
            };

            // Backend provides trade counts
            const activity: ActivitySummary = {
                totalDecisionPoints: data.total_trades || 0,
                tradesExecuted: data.winning_trades + (data.losing_trades || 0) || 0,
            };

            console.log('Parsed positions:', positions.length, 'Summary:', summary);
            return { status: TraderStatus.LIVE, positions, summary, activity };
        }

        // If status is not active or is_trading is false, return stopped
        console.log('Trading not running, status:', data.status, 'is_trading:', data.is_trading);
        return { status: TraderStatus.STOPPED, positions: [], summary: null, activity: null };
    } catch (error) {
        console.error('Failed to fetch status:', error);
        return { status: TraderStatus.STOPPED, positions: [], summary: null, activity: null };
    }
  },

  start: async (payload: StartTraderPayload): Promise<{ message: string }> => {
    console.log('Starting trader with payload:', payload);
    const response = await fetch(`${API_BASE_URL}/api/v1/rl/live/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    const result = await handleResponse(response);
    console.log('Start response:', result);
    return result;
  },

  stop: async (): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/rl/live/stop`, {
        method: 'POST',
        headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getTradeHistory: async (): Promise<Trade[]> => {
    try {
        const data = await getCachedOrFetchStatus();
        console.log('Trade history from cached/fresh backend data');

        // Backend returns recent_trades array with different actions: BUY, SELL, UPDATE
        const recentTrades = data.recent_trades || [];
        
        // Map backend trade format to frontend Trade type
        return recentTrades.map((trade: any, index: number) => {
            const isClosed = trade.action === 'SELL';
            const pnl = trade.pnl || 0; // PnL only available for closed trades (SELL)
            
            return {
                id: `${trade.symbol}-${trade.timestamp}-${index}`,
                symbol: trade.symbol,
                entryDate: trade.timestamp,
                exitDate: isClosed ? trade.timestamp : undefined, // Only show exit date for closed trades
                quantity: trade.position_size || trade.shares || 0,
                entryPrice: trade.price || trade.entry_price || 0,
                exitPrice: isClosed ? trade.price : undefined,
                pnl: pnl,
                fees: trade.transaction_costs || 0,
            };
        });
    } catch (error) {
        console.error('Failed to fetch trade history:', error);
        return [];
    }
  },

  getPerformanceMetrics: async (): Promise<PerformanceData> => {
    try {
        // Use dedicated /api/v1/rl/state endpoint for performance data
        console.log('Fetching performance data from /api/v1/rl/state');
        const response = await fetch(`${API_BASE_URL}/api/v1/rl/state`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch performance: ${response.status}`);
        }

        const data = await response.json();
        console.log('Performance data from /api/v1/rl/state:', data);
        
        // Check if trading is active
        if (data.status !== 'running' && data.status !== 'active') {
            console.log('Performance metrics unavailable - trading not active');
            throw new Error('Trading not active');
        }
        
        // Use the performance_metrics object from the state endpoint
        const perfMetrics = data.performance_metrics || {};
        
        // Calculate closed trades from winning/losing trades if available
        const closedTrades = (data.winning_trades || 0) + (data.losing_trades || 0);
        
        const metrics: PerformanceMetrics = {
            totalReturn: data.total_return || perfMetrics.total_return || 0,
            sharpeRatio: data.sharpe_ratio || perfMetrics.sharpe_ratio || 0,
            sortinoRatio: 0, // Backend doesn't provide this yet
            calmarRatio: 0, // Backend doesn't provide this yet
            maxDrawdown: data.max_drawdown || perfMetrics.max_drawdown || 0,
            winRate: data.win_rate || perfMetrics.win_rate || 0,
            numTrades: data.trade_count || 0,
            closedTrades: closedTrades,
            finalBalance: data.balance || 0,
        };
        
        // Get recent trades from the state endpoint
        const recentTrades = data.recent_trades || [];
        const trades: Trade[] = recentTrades.map((trade: any, index: number) => {
            const isClosed = trade.action === 'SELL';
            const pnl = trade.pnl || 0;
            
            return {
                id: `${trade.symbol}-${trade.timestamp}-${index}`,
                symbol: trade.symbol,
                entryDate: trade.timestamp,
                exitDate: isClosed ? trade.timestamp : undefined,
                quantity: trade.position_size || trade.shares || 0,
                entryPrice: trade.price || trade.entry_price || 0,
                exitPrice: isClosed ? trade.price : undefined,
                pnl: pnl,
                fees: trade.transaction_costs || 0,
            };
        });
        
        console.log('Performance metrics from /api/v1/rl/state:', metrics);
        return { metrics, trades };
    } catch (error) {
        console.error('Failed to fetch performance metrics:', error);
        throw error;
    }
  },

  getPrediction: async (symbol: string): Promise<Prediction> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/rl/predict`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ symbol }), // API requires symbol, other fields are optional
    });
    const data: ApiPrediction = await handleResponse(response);
    return mapApiToPrediction(data);
  },

  getModelState: async (): Promise<ModelState> => {
    try {
        const data = await getCachedOrFetchStatus();
        
        // Backend provides recent_trades with confidence and action data
        // Use the most recent trade as the "last prediction"
        const recentTrades = data.recent_trades || [];
        
        if (recentTrades.length > 0) {
            const lastTrade = recentTrades[recentTrades.length - 1];
            
            return {
                lastPrediction: {
                    actionType: lastTrade.action || 'HOLD',
                    positionSize: lastTrade.position_size || 0,
                    confidence: lastTrade.confidence || 0,
                    expectedReturn: 0, // Not provided by backend
                    riskScore: lastTrade.risk_score || 0,
                },
                timestamp: lastTrade.timestamp || data.timestamp || new Date().toISOString(),
            };
        }
        
        // No trades yet
        return {
            lastPrediction: null,
            timestamp: data.timestamp || new Date().toISOString(),
        };
    } catch (error) {
        console.error('Failed to fetch model state:', error);
        throw error;
    }
  },
};