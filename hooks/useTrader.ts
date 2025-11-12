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
  const lastTradeCountRef = useRef<number>(0);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound (optional - can be disabled)
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    const createBeepSound = () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800; // Frequency in Hz
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.log('Audio notification not available:', error);
      }
    };
    
    notificationSoundRef.current = { play: createBeepSound } as any;
  }, []);

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
    console.log('[useTrader.fetchStatusAndPositions] Starting fetch, isInitialLoad:', isInitialLoad);
    if (isInitialLoad) setIsLoading(true);
    try {
      const { status, positions, summary, activity } = await tradingService.getFullStatus();
      console.log('[useTrader.fetchStatusAndPositions] Received:', 
        'status:', status, 
        'positions:', positions.length, 
        'summary:', summary ? 'exists' : 'null',
        'activity:', activity ? 'exists' : 'null'
      );
      setStatus(status);
      setPositions(positions);
      setPortfolioSummary(summary);
      setActivitySummary(activity);
      if (status === TraderStatus.LIVE) {
        console.log('[useTrader.fetchStatusAndPositions] Status is LIVE, fetching model state');
        fetchModelState();
      } else {
        console.log('[useTrader.fetchStatusAndPositions] Status is not LIVE, clearing model state');
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
      console.log('[useTrader.fetchStatusAndPositions] Fetch complete');
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
      // Fetch from backend which now provides complete performance_metrics
      const data = await tradingService.getPerformanceMetrics();
      setPerformanceData(data);
    } catch (error) {
      console.error("Failed to fetch performance metrics", error);
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
    console.log('[useTrader.handleStart] Starting with payload:', payload);
    setIsActionLoading(true);
    try {
      await tradingService.start(payload);
      console.log('[useTrader.handleStart] Trading service started, closing modal');
      closeConfigModal();
      
      // Request notification permission if not already granted
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            console.log('Browser notifications enabled');
          }
        });
      }
      
      // Fetch status once after starting
      console.log('[useTrader.handleStart] Fetching status and positions');
      await fetchStatusAndPositions();
      console.log('[useTrader.handleStart] Status fetch complete');
      showToast('Live trading started successfully! 🚀', 'success');
    } catch (error) {
      console.error("Failed to start trader", error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      showToast(errorMessage, 'error');
    } finally {
      setIsActionLoading(false);
      console.log('[useTrader.handleStart] handleStart complete');
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
  
  // Trade notification effect - detects new trades and shows alerts
  useEffect(() => {
    if (!activitySummary || status !== TraderStatus.LIVE) {
      return;
    }

    const currentTradeCount = activitySummary.totalDecisionPoints;
    const previousTradeCount = lastTradeCountRef.current;

    // Detect new trades (skip initial load when previousTradeCount is 0)
    if (currentTradeCount > previousTradeCount && previousTradeCount > 0) {
      const newTradesCount = currentTradeCount - previousTradeCount;
      
      // Show toast notification
      showToast(
        `🎯 ${newTradesCount} new trade${newTradesCount > 1 ? 's' : ''} executed!`,
        'success'
      );
      
      // Play notification sound
      if (notificationSoundRef.current) {
        try {
          notificationSoundRef.current.play();
        } catch (error) {
          console.log('Could not play notification sound:', error);
        }
      }
      
      // Optional: Browser notification (requires permission)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Trade Executed', {
          body: `${newTradesCount} new trade${newTradesCount > 1 ? 's' : ''} executed`,
          icon: '/favicon.ico', // Add your icon
          tag: 'trade-notification',
        });
      }
      
      console.log(`🔔 New trades detected: ${previousTradeCount} → ${currentTradeCount}`);
    }

    // Update the ref with current count
    lastTradeCountRef.current = currentTradeCount;
  }, [activitySummary, status]);
  
  useEffect(() => {
    console.log('Polling effect triggered, status:', status);
    if (status === TraderStatus.LIVE) {
      // Set up polling when live
      if (!intervalRef.current) {
        console.log('Setting up polling interval');
        intervalRef.current = window.setInterval(() => {
          console.log('Polling for status update');
          fetchStatusAndPositions();
        }, 300000); // Poll every 5 minutes to match backend trading interval
      }
    } else {
      // Clear polling when not live
      if (intervalRef.current) {
        console.log('Clearing polling interval');
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
