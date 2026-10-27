import React from 'react';
import {
  LayoutDashboard,
  Compass,
  ArrowLeftRight,
  PieChart,
  Target,
  Lightbulb,
  FileText,
  UserCheck,
  Code2,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

export type ActiveTab =
  | 'dashboard'
  | 'survival'
  | 'transactions'
  | 'budgets'
  | 'savings'
  | 'insights'
  | 'reports'
  | 'profile'
  | 'architecture';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  onQuickAdd: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  onQuickAdd
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'survival', label: 'Survival Predictor', icon: Compass, special: true },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'budgets', label: 'Smart Budgets', icon: PieChart },
    { id: 'savings', label: 'Savings Goals', icon: Target },
    { id: 'insights', label: 'Spending Insights', icon: Lightbulb },
    { id: 'reports', label: 'Reports & Export', icon: FileText },
    { id: 'architecture', label: 'Project Architecture & Viva', icon: Code2 },
    { id: 'profile', label: 'Profile & Settings', icon: UserCheck }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 md:hidden backdrop-blur-xs"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              ₹
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight block leading-tight">
                SpendSense
              </span>
              <span className="text-[11px] text-slate-400 font-medium block">
                Student Pocket Money
              </span>
            </div>
          </div>
        </div>

        {/* Demo Notice Banner (if in demo mode) */}
        {user?.isDemo && (
          <div className="mx-4 mt-3 px-3 py-2 bg-amber-50/80 border border-amber-200/80 rounded-lg text-xs text-amber-800">
            <span className="font-semibold block">Demo Account (Temporary RAM)</span>
            <span className="text-[11px] text-amber-700">Preloaded with 30+ student records</span>
          </div>
        )}

        {/* Temporary Guest Session Notice */}
        {user?.isTemp && (
          <div className="mx-4 mt-3 px-3 py-2 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800">
            <span className="font-semibold block">Temporary Storage Active</span>
            <span className="text-[11px] text-teal-700">In-memory guest workspace (RAM)</span>
          </div>
        )}

        {/* Quick Add CTA */}
        <div className="px-4 mt-3 mb-2">
          <button
            onClick={() => {
              onQuickAdd();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            + Quick Add Transaction
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as ActiveTab);
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                  isActive
                    ? item.special
                      ? 'bg-teal-50 text-teal-800 font-semibold border border-teal-200/60'
                      : 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive
                      ? item.special
                        ? 'text-teal-600'
                        : 'text-slate-900'
                      : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
                {item.special && !isActive && (
                  <span className="ml-auto text-[10px] text-teal-600 font-medium">Predict</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 mr-2">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {user?.full_name || 'Student User'}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {user?.email || 'student@college.edu'}
              </p>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
