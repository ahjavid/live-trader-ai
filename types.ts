export enum TraderStatus {
  LIVE = 'LIVE',
  STOPPED = 'STOPPED',
  PENDING = 'PENDING',
}

export enum PositionSide {
    BUY = 'LONG',
    SELL = 'SHORT',
}

export interface Position {
  id: string;
  symbol: string;
  side: PositionSide;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'error';
}

export interface PortfolioSummary {
  portfolioValue: number;
  unrealizedPnl: number;
  realizedPnl: number; // Note: not in new status response, might be deprecated
  totalPnl: number;
  drawdown: number;
  balance: number;
  dailyPnl: number;
  winRate: number;
  tradeCount: number;
}

export interface ActivitySummary {
  totalDecisionPoints: number; // Total trades opened
  tradesExecuted: number; // Closed trades
}

export interface Trade {
  id: string;
  symbol: string;
  entryDate: string;
  exitDate?: string; // Optional for open positions
  quantity: number;
  entryPrice: number;
  exitPrice?: number; // Optional for open positions
  pnl: number;
  fees: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  maxDrawdown: number;
  winRate: number;
  numTrades: number; // Total trades (including open positions)
  closedTrades: number; // Only closed/completed trades
  finalBalance: number;
}

export interface PerformanceData {
  metrics: PerformanceMetrics;
  trades: Trade[];
}

export interface Prediction {
  actionType: string;
  positionSize: number;
  confidence: number;
  expectedReturn: number;
  riskScore: number;
}

export interface ModelState {
  lastPrediction: Prediction | null;
  timestamp: string;
}


// --- API Types based on new detailed spec ---

export interface TraderConfig {
    initial_balance?: number;
    min_confidence?: number;
    max_risk?: number;
    max_position?: number;
    max_risk_per_trade?: number;
    max_positions?: number;
    max_drawdown?: number;
    position_limit?: number;
    risk_multiplier?: number;
    stop_loss?: number;
    take_profit?: number;
}

export interface StartTraderPayload {
  symbols: string[];
  config: TraderConfig;
}

export interface ApiPosition {
  shares?: number;
  position_shares?: number;
  average_price?: number;
  entry_price_per_share?: number;
  current_market_price: number;
  unrealized_pnl: number;
  entry_time: string;
}

export interface ApiActivitySummary {
  total_decision_points: number;
  reconfirmations: number;
  trades_executed: number;
}

export interface ApiStatusResponse {
  timestamp: string;
  portfolio_value?: number;
  total_portfolio_value?: number;
  balance?: number;
  available_cash?: number;
  daily_pnl: number;
  total_pnl: number;
  unrealized_pnl: number;
  realized_pnl?: number; // Kept for mapping if it exists, but not in new schema
  drawdown: number;
  win_rate: number;
  trade_count: number;
  position_details?: {
    [symbol: string]: ApiPosition;
  };
  activity_summary?: ApiActivitySummary;
}

export interface ApiTrade {
  entry_date: string;
  exit_date: string;
  symbol: string;
  position_size: number;
  entry_price: number;
  exit_price: number;
  pnl: number;
  fees: number;
}

export interface ApiPerformanceResponse {
  total_return: number;
  sharpe_ratio: number;
  sortino_ratio: number;
  calmar_ratio: number;
  max_drawdown: number;
  win_rate: number;
  num_trades: number;
  final_balance: number;
  trades: ApiTrade[];
}

export interface ApiPrediction {
  action_type: string;
  position_size: number;
  confidence: number;
  expected_return: number;
  risk_score: number;
}

export interface ApiModelState {
  last_prediction: ApiPrediction;
  timestamp: string;
}