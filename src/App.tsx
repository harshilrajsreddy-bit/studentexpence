import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/common/Header.tsx';
import { Sidebar, ActiveTab } from './components/common/Sidebar.tsx';
import { ToastContainer, ToastMessage } from './components/common/Toast.tsx';
import { TransactionModal } from './components/transactions/TransactionModal.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { SurvivalPredictorPage } from './pages/SurvivalPredictorPage.tsx';
import { TransactionsPage } from './pages/TransactionsPage.tsx';
import { BudgetsPage } from './pages/BudgetsPage.tsx';
import { SavingsPage } from './pages/SavingsPage.tsx';
import { InsightsPage } from './pages/InsightsPage.tsx';
import { ReportsPage } from './pages/ReportsPage.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { ArchitectureVivaPage } from './pages/ArchitectureVivaPage.tsx';
import { AuthPage } from './pages/AuthPage.tsx';
import { api } from './services/api.ts';
import { RefreshCw } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleQuickAddSubmit = async (data: any) => {
    try {
      await api.createTransaction(data);
      showToast('Transaction recorded successfully', 'success');
      // Trigger refresh by toggling tab or reload state
      setActiveTab(prev => prev);
    } catch (err: any) {
      showToast(err.message || 'Failed to record transaction', 'error');
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg mb-3 shadow-sm">
          ₹
        </div>
        <p className="text-xs font-semibold text-slate-700 flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
          Loading Student SpendSense...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AuthPage showToast={showToast} />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-900 flex flex-col">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0">
        <Header
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        />

        <main className="flex-1 pb-12">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onQuickAdd={() => setIsQuickAddOpen(true)}
              onNavigate={setActiveTab}
              showToast={showToast}
            />
          )}

          {activeTab === 'survival' && (
            <SurvivalPredictorPage
              showToast={showToast}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsPage showToast={showToast} />
          )}

          {activeTab === 'budgets' && (
            <BudgetsPage showToast={showToast} />
          )}

          {activeTab === 'savings' && (
            <SavingsPage showToast={showToast} />
          )}

          {activeTab === 'insights' && (
            <InsightsPage
              showToast={showToast}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage showToast={showToast} />
          )}

          {activeTab === 'profile' && (
            <ProfilePage showToast={showToast} />
          )}

          {activeTab === 'architecture' && (
            <ArchitectureVivaPage />
          )}
        </main>
      </div>

      {/* Global Quick Add Transaction Modal */}
      <TransactionModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSubmit={handleQuickAddSubmit}
      />

      {/* Global Notification Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
