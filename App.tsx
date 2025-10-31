import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ControlPanel from './components/ControlPanel';
import PositionsTable from './components/PositionsTable';
import { useTrader } from './hooks/useTrader';
import Toast from './components/Toast';
import LoadingSpinner from './components/LoadingSpinner';
import PortfolioSummary from './components/PortfolioSummary';
import ConfigModal from './components/ConfigModal';
import PriceChart from './components/PriceChart';
import ActivitySummary from './components/ActivitySummary';
import Tabs from './components/Tabs';
import TradeHistoryTable from './components/TradeHistoryTable';
import PerformanceDashboard from './components/PerformanceDashboard';
import LastModelState from './components/LastModelState';
import ManualPredict from './components/ManualPredict';

type Tab = 'dashboard' | 'history' | 'performance';

const App: React.FC = () => {
  const {
    status,
    positions,
    portfolioSummary,
    activitySummary,
    trades,
    // FIX: Destructure performanceData which is the comprehensive object returned by the hook.
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
  } = useTrader();

  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  useEffect(() => {
    // Only fetch data when switching to a tab, and only if we don't already have recent data
    if (activeTab === 'history' && trades.length === 0) {
      fetchTradeHistory();
    }
    if (activeTab === 'performance' && !performanceData && status === 'LIVE') {
      // Delay to avoid burst with main status polling
      const timer = setTimeout(() => {
        fetchPerformanceMetrics();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, status, fetchTradeHistory, fetchPerformanceMetrics, trades.length, performanceData]);

  const renderContent = () => {
    if (isLoading && status !== 'LIVE') {
      return (
        <div className="flex justify-center items-center h-96 mt-8">
          <LoadingSpinner />
        </div>
      );
    }

    if (activeTab === 'dashboard') {
      return (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
          {/* Main Content - Takes up remaining vertical space */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="bg-brand-surface rounded-lg shadow-xl ring-1 ring-white/10 flex-grow flex flex-col">
              <PositionsTable positions={positions} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-8">
            <div className="bg-brand-surface rounded-lg shadow-xl ring-1 ring-white/10 p-4 h-96">
              <PriceChart positions={positions} />
            </div>
            <div className="bg-brand-surface rounded-lg shadow-xl ring-1 ring-white/10 p-4">
              <LastModelState modelState={modelState} />
            </div>
            <div className="bg-brand-surface rounded-lg shadow-xl ring-1 ring-white/10 p-4">
              <ManualPredict
                prediction={prediction}
                isLoading={isPredictionLoading}
                onPredict={fetchPrediction}
              />
            </div>
          </aside>
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="mt-8 bg-brand-surface rounded-lg shadow-xl ring-1 ring-white/10 overflow-hidden">
          {isHistoryLoading ? (
            <div className="flex justify-center items-center h-96">
              <LoadingSpinner />
            </div>
          ) : (
            <TradeHistoryTable trades={trades} />
          )}
        </div>
      );
    }

    if (activeTab === 'performance') {
        return (
            <div className="mt-8">
                {isPerformanceLoading ? (
                    <div className="flex justify-center items-center h-96">
                        <LoadingSpinner />
                    </div>
                ) : (
                    // FIX: Pass the entire performanceData object to the dashboard.
                    <PerformanceDashboard data={performanceData} />
                )}
            </div>
        );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-brand-bg font-sans text-brand-text flex flex-col">
      <Header />
      <main className="container mx-auto p-4 md:p-6 lg:p-8 flex-grow flex flex-col">
        <ControlPanel
          status={status}
          onStart={openConfigModal}
          onStop={handleStop}
          onRefresh={handleRefresh}
          isLoading={isActionLoading || (isLoading && status !== 'LIVE')}
        />
        
        {status === 'LIVE' && portfolioSummary && activitySummary && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-4">
              <PortfolioSummary summary={portfolioSummary} />
            </div>
            <div className="md:col-span-2">
              <ActivitySummary summary={activitySummary} />
            </div>
          </div>
        )}

        {/* FIX: Show tabs if not stopped OR if historical data exists. */}
        {(status !== 'STOPPED' || trades.length > 0 || performanceData) && (
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        )}
        
        {renderContent()}

      </main>
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={clearToast}
        />
      )}

      <ConfigModal 
        isOpen={isConfigModalOpen}
        onClose={closeConfigModal}
        onStart={handleStart}
        isLoading={isActionLoading}
      />
    </div>
  );
};

export default App;
