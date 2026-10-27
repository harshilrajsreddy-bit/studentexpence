import React from 'react';
import { Menu, PlusCircle, Sparkles } from 'lucide-react';
import { ActiveTab } from './Sidebar.tsx';
import { useAuth } from '../../context/AuthContext.tsx';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSidebar: () => void;
  onOpenQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSidebar,
  onOpenQuickAdd
}) => {
  const { user } = useAuth();

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview';
      case 'survival':
        return 'Survival Predictor';
      case 'transactions':
        return 'Transactions Ledger';
      case 'budgets':
        return 'Monthly Budgets';
      case 'savings':
        return 'Savings Goals';
      case 'insights':
        return 'Spending Insights';
      case 'reports':
        return 'Reports & Export';
      case 'architecture':
        return 'Architecture & Viva';
      case 'profile':
        return 'Profile & Settings';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 md:px-8 flex items-center justify-between gap-4">
      {/* Zone 1: Mobile toggle + Breadcrumb / Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 md:hidden rounded-lg hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="font-bold text-slate-900 tracking-tight whitespace-nowrap">
            Student SpendSense
          </span>
          <span className="text-slate-300 font-light hidden sm:inline">/</span>
          <span className="text-slate-600 font-medium truncate hidden sm:inline">
            {getBreadcrumb()}
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links (desktop quick jump) */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'dashboard' ? 'text-teal-700 font-semibold' : ''
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('survival')}
          className={`flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'survival' ? 'text-teal-700 font-semibold' : ''
          }`}
        >
          <Sparkles className="w-3 h-3 text-teal-600" />
          Survival Predictor
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'transactions' ? 'text-teal-700 font-semibold' : ''
          }`}
        >
          Transactions
        </button>
        <button
          onClick={() => setActiveTab('budgets')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'budgets' ? 'text-teal-700 font-semibold' : ''
          }`}
        >
          Budgets
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'architecture' ? 'text-teal-700 font-semibold' : ''
          }`}
        >
          Viva & Docs
        </button>
      </nav>

      {/* Zone 3: 1 Primary Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-teal-50 border border-teal-200/80 rounded-md text-[11px] font-semibold text-teal-800">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          <span>Temporary Storage</span>
        </div>

        <div className="hidden md:flex items-center text-xs text-slate-500 font-medium mr-1">
          <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold">
            {user?.currency || '₹'}
          </span>
        </div>

        <button
          onClick={onOpenQuickAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Record</span>
        </button>
      </div>
    </header>
  );
};
