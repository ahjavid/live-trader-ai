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
    const apiKey = process.env.API_KEY || '';
    if (!apiKey) {
        console.warn('API Key is not set. Please ensure the API_KEY environment variable is configured.');
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
    finalBalance: data.final_balance,
});

const mapApiToPrediction = (data: ApiPrediction): Prediction => ({
    actionType: data.action_type,
    positionSize: data.position_size,
    confidence: data.confidence,
    expectedReturn: data.expected_return,
    riskScore: data.risk_score,
});

const mapApiToModelState = (data: ApiModelState): ModelState => ({
    lastPrediction: data.last_prediction ? mapApiToPrediction(data.last_prediction) : null,
    timestamp: data.timestamp,
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
        
        // Check if trading is actually running - backend returns status: "active" when live
        if (data.is_trading === true || data.status === "active") {
            // Extract positions from the actual backend structure: positions: { "SYMBOL": {...} }
            const positionsObj = data.positions || {};
            const positions = Object.entries(positionsObj).map(([symbol, pos]: [string, any]) => ({
                id: symbol,
                symbol: symbol,
                side: pos.position_size >= 0 ? PositionSide.BUY : PositionSide.SELL,
                quantity: Math.abs(pos.position_size || 0),
                entryPrice: pos.entry_price || 0,
                currentPrice: pos.entry_price || 0, // Backend doesn't provide current price
                pnl: pos.current_pnl || 0,
            }));

            // Map the actual backend response to frontend summary structure
            // Backend now provides performance_metrics with calculated values
            const perfMetrics = data.performance_metrics || {};
            const totalPnl = positions.reduce((sum, pos) => sum + pos.pnl, 0);
            const summary: PortfolioSummary = {
                portfolioValue: data.portfolio_value || data.balance || 0,
                unrealizedPnl: totalPnl,
                realizedPnl: perfMetrics.total_pnl || 0, // From backend performance metrics
                totalPnl: perfMetrics.total_pnl || totalPnl,
                drawdown: perfMetrics.max_drawdown || 0, // From backend performance metrics
                balance: data.balance || 0,
                dailyPnl: totalPnl,
                winRate: perfMetrics.win_rate || 0, // From backend performance metrics
                tradeCount: data.total_trades || 0,
            };

            // Backend provides trade counts but not activity_summary
            // totalDecisionPoints = all trades opened (total_trades)
            // tradesExecuted = closed trades (num_trades from performance_metrics)
            const activity: ActivitySummary = {
                totalDecisionPoints: data.total_trades || 0, // All trades
                tradesExecuted: perfMetrics.num_trades || 0, // Closed trades only
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

        // Backend now returns recent_trades array (last 50 trades)
        const recentTrades = data.recent_trades || [];
        
        // Map backend trade format to frontend Trade type
        return recentTrades.map((trade: any, index: number) => ({
            id: `${trade.symbol}-${trade.timestamp}-${index}`,
            symbol: trade.symbol,
            entryDate: trade.timestamp,
            exitDate: trade.timestamp, // Backend doesn't separate entry/exit for open positions
            quantity: trade.position_size,
            entryPrice: trade.price,
            exitPrice: trade.price,
            pnl: trade.pnl,
            fees: 0, // Not provided by backend
        }));
    } catch (error) {
        console.error('Failed to fetch trade history:', error);
        return [];
    }
  },

  getPerformanceMetrics: async (): Promise<PerformanceData> => {
    try {
        const data = await getCachedOrFetchStatus();
        console.log('Performance data from cached/fresh backend:', data.performance_metrics);
        
        // Check if trading is active
        if (!data.is_trading && data.status !== 'active') {
            console.log('Performance metrics unavailable - trading not active');
            throw new Error('Trading not active');
        }
        
        // Backend now provides performance_metrics object with all calculated metrics
        const backendMetrics = data.performance_metrics || {};
        
        const metrics: PerformanceMetrics = {
            totalReturn: backendMetrics.total_return || 0,
            sharpeRatio: backendMetrics.sharpe_ratio || 0,
            sortinoRatio: 0, // Backend doesn't provide this yet
            calmarRatio: 0, // Backend doesn't provide this yet
            maxDrawdown: backendMetrics.max_drawdown || 0,
            winRate: backendMetrics.win_rate || 0,
            numTrades: backendMetrics.num_trades || 0,
            finalBalance: data.balance || 0,
        };
        
        // Get recent trades from backend
        const recentTrades = data.recent_trades || [];
        const trades: Trade[] = recentTrades.map((trade: any, index: number) => ({
            id: `${trade.symbol}-${trade.timestamp}-${index}`,
            symbol: trade.symbol,
            entryDate: trade.timestamp,
            exitDate: trade.timestamp,
            quantity: trade.position_size,
            entryPrice: trade.price,
            exitPrice: trade.price,
            pnl: trade.pnl,
            fees: 0,
        }));
        
        console.log('Performance metrics from backend:', metrics);
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