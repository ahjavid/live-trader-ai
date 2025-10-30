import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TraderStatus, 
  Position, 
  ToastMessage, 
  StartTraderPayload, 
  PortfolioSummary, 
  ActivitySummary, 
  Trade,
  PerformanceData,
  Prediction,
  ModelState
} from '../types';
import { tradingService } from '../services/tradingService';

export const useTrader = () => {
  const [status, setStatus] = useState<TraderStatus>(TraderStatus.STOPPED);
  const [positions, setPositions] = useState<Position[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [modelState, setModelState] = useState<ModelState | null>(null);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState<boolean>(false);
  const [isPredictionLoading, setIsPredictionLoading] = useState<boolean>(false);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const intervalRef = useRef<number | null>(null);

  const clearToast = () => setToast(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      clearToast();
    }, 4000);
  };

  const openConfigModal = () => setIsConfigModalOpen(true);
  const closeConfigModal = () => setIsConfigModalOpen(false);

  const fetchModelState = useCallback(async () => {
    try {
      const state = await tradingService.getModelState();
      setModelState(state);
    } catch (error) {
      console.error("Failed to fetch model state", error);
    }
  }, []);

  const fetchStatusAndPositions = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    try {
      const { status, positions, summary, activity } = await tradingService.getFullStatus();
      setStatus(status);
      setPositions(positions);
      setPortfolioSummary(summary);
      setActivitySummary(activity);
      if (status === TraderStatus.LIVE) {
        fetchModelState();
      } else {
        setModelState(null);
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      showToast('Failed to fetch latest data.', 'error');
      setStatus(TraderStatus.STOPPED);
      setPositions([]);
      setPortfolioSummary(null);
      setActivitySummary(null);
      setModelState(null);
    } finally {
      if (isInitialLoad) setIsLoading(false);
    }
  }, [fetchModelState]);

  const fetchTradeHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const tradeHistory = await tradingService.getTradeHistory();
      setTrades(tradeHistory);
    } catch (error) {
      console.error("Failed to fetch trade history", error);
      const errorMessage = error instanceof Error ? error.message : 'Could not load trade history.';
      showToast(errorMessage, 'error');
      setTrades([]);
    } finally {
      setIsHistoryLoading(false);
    }
  }, []);

  const fetchPerformanceMetrics = useCallback(async () => {
    setIsPerformanceLoading(true);
    try {
      const data = await tradingService.getPerformanceMetrics();
      setPerformanceData(data);
    } catch (error) {
      console.error("Failed to fetch performance metrics", error);
      const errorMessage = error instanceof Error ? error.message : 'Could not load performance data.';
      showToast(errorMessage, 'error');
      setPerformanceData(null);
    } finally {
      setIsPerformanceLoading(false);
    }
  }, []);

  const fetchPrediction = useCallback(async (symbol: string) => {
    setIsPredictionLoading(true);
    setPrediction(null);
    try {
      const pred = await tradingService.getPrediction(symbol);
      setPrediction(pred);
    } catch (error) {
      console.error("Failed to fetch prediction", error);
      const errorMessage = error instanceof Error ? error.message : `Could not get prediction for ${symbol}.`;
      showToast(errorMessage, 'error');
      setPrediction(null);
    } finally {
      setIsPredictionLoading(false);
    }
  }, []);

  const handleStart = useCallback(async (payload: StartTraderPayload) => {
    setIsActionLoading(true);
    try {
      await tradingService.start(payload);
      closeConfigModal();
      await fetchStatusAndPositions();
      showToast('Live trading started successfully!', 'success');
    } catch (error) {
      console.error("Failed to start trader", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      showToast(errorMessage, 'error');
    } finally {
      setIsActionLoading(false);
    }
  }, [fetchStatusAndPositions]);

  const handleStop = useCallback(async () => {
    setIsActionLoading(true);
    try {
      await tradingService.stop();
      setStatus(TraderStatus.STOPPED);
      setPositions([]);
      setPortfolioSummary(null);
      setActivitySummary(null);
      setModelState(null);
      showToast('Trading has been stopped.', 'success');
    } catch (error) {
      // FIX: Corrected malformed catch block and added error handling.
      console.error("Failed to stop trader", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      showToast(errorMessage, 'error');
    } finally {
      setIsActionLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchStatusAndPositions();
    showToast('Data refreshed.', 'success');
  }, [fetchStatusAndPositions]);

  useEffect(() => {
    fetchStatusAndPositions(true); // Initial load
  }, [fetchStatusAndPositions]);
  
  useEffect(() => {
    if (status === TraderStatus.LIVE) {
      // Set up polling when live
      intervalRef.current = window.setInterval(() => {
        fetchStatusAndPositions();
      }, 5000); // Poll every 5 seconds
    } else {
      // Clear polling when not live
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, fetchStatusAndPositions]);

  return {
    status,
    positions,
    portfolioSummary,
    activitySummary,
    trades,
    performanceData,
    prediction,
    modelState,
    isLoading,
    isActionLoading,
    isHistoryLoading,
    isPerformanceLoading,
    isPredictionLoading,
    toast,
    isConfigModalOpen,
    handleStart,
    handleStop,
    handleRefresh,
    fetchTradeHistory,
    fetchPerformanceMetrics,
    fetchPrediction,
    clearToast,
    openConfigModal,
    closeConfigModal,
  };
};
