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
    totalDecisionPoints: data.activity_summary.total_decision_points,
    reconfirmations: data.activity_summary.reconfirmations,
    tradesExecuted: data.activity_summary.trades_executed,
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

export const tradingService = {
  getFullStatus: async (): Promise<{ status: TraderStatus; positions: Position[]; summary: PortfolioSummary | null; activity: ActivitySummary | null }> => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/rl-trading/live/status`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!response.ok) {
            // A 404 or other error likely means the service isn't running live
            return { status: TraderStatus.STOPPED, positions: [], summary: null, activity: null };
        }
        
        const data: ApiStatusResponse = await response.json();
        
        if (data && data.position_details) {
            const positions = Object.entries(data.position_details).map(([symbol, apiPos]) => mapApiPositionToPosition(symbol, apiPos));
            const summary = mapApiStatusToSummary(data);
            const activity = mapApiToActivitySummary(data);
            return { status: TraderStatus.LIVE, positions, summary, activity };
        }

        // If the response is valid but has no positions, it's live but idle.
        if (data) {
             const summary = mapApiStatusToSummary(data);
             const activity = mapApiToActivitySummary(data);
             return { status: TraderStatus.LIVE, positions: [], summary, activity };
        }

        return { status: TraderStatus.STOPPED, positions: [], summary: null, activity: null };
    } catch (error) {
        console.error('Failed to fetch status:', error);
        return { status: TraderStatus.STOPPED, positions: [], summary: null, activity: null };
    }
  },

  start: async (payload: StartTraderPayload): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/rl-trading/live/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  stop: async (): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/rl-trading/live/stop`, {
        method: 'POST',
        headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getTradeHistory: async (): Promise<Trade[]> => {
    const response = await fetch(`${API_BASE_URL}/api/rl-trading/trades`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data: ApiTrade[] = await handleResponse(response);
    if (Array.isArray(data)) {
        return data.map(mapApiTradeToTrade);
    }
    return [];
  },

  getPerformanceMetrics: async (): Promise<PerformanceData> => {
    const response = await fetch(`${API_BASE_URL}/api/rl-trading/performance`, {
        method: 'GET',
        headers: getHeaders(),
    });
    const data: ApiPerformanceResponse = await handleResponse(response);
    const metrics = mapApiToPerformanceMetrics(data);
    const trades = Array.isArray(data.trades) ? data.trades.map(mapApiTradeToTrade) : [];
    return { metrics, trades };
  },

  getPrediction: async (symbol: string): Promise<Prediction> => {
    const response = await fetch(`${API_BASE_URL}/api/rl-trading/predict`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ symbol }), // API requires symbol, other fields are optional
    });
    const data: ApiPrediction = await handleResponse(response);
    return mapApiToPrediction(data);
  },

  getModelState: async (): Promise<ModelState> => {
    const response = await fetch(`${API_BASE_URL}/api/rl-trading/state`, {
        method: 'GET',
        headers: getHeaders(),
    });
    const data: ApiModelState = await handleResponse(response);
    return mapApiToModelState(data);
  },
};