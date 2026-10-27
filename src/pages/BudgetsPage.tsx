import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Trash2,
  Edit2
} from 'lucide-react';
import { Budget } from '../types/index.ts';
import { api } from '../services/api.ts';
import { BudgetModal } from '../components/budgets/BudgetModal.tsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface BudgetsPageProps {
  showToast: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({ showToast }) => {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [overallBudget, setOverallBudget] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<string | undefined>();
  const [editingAmount, setEditingAmount] = useState<number | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBudgets = async (targetMonth = month) => {
    try {
      setLoading(true);
      const data = await api.getBudgets(targetMonth);
      setBudgets(data.budgets);
      setTotalSpent(data.totalSpent);
      setOverallBudget(data.overallBudget);
    } catch (err: any) {
      showToast(err.message || 'Failed to load budgets', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets(month);
  }, [month]);

  const handleSaveBudget = async (category: string, amount: number, budgetMonth: string) => {
    try {
      await api.upsertBudget(category, amount, budgetMonth);
      showToast(`Budget for ${category} updated`, 'success');
      fetchBudgets(month);
    } catch (err: any) {
      showToast(err.message || 'Failed to update budget', 'error');
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await api.deleteBudget(deletingId);
      showToast('Budget limit removed', 'success');
      setDeletingId(null);
      fetchBudgets(month);
    } catch (err: any) {
      showToast(err.message || 'Failed to remove budget', 'error');
    }
  };

  const overall = budgets.find(b => b.category.toLowerCase() === 'overall');
  const categoryBudgets = budgets.filter(b => b.category.toLowerCase() !== 'overall');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
              <PieIcon className="w-5 h-5 text-teal-600" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Smart Budget Manager
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Set and track spending boundaries with automated alerts at 75%, 90%, and 100% capacity
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
          <button
            onClick={() => {
              setEditingCategory(undefined);
              setEditingAmount(undefined);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category Limit</span>
          </button>
        </div>
      </div>

      {/* Overall Budget Header Card */}
      {overall && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">
                  Master Limit
                </span>
                <span className="text-xs text-slate-400">·</span>
                <span className="text-xs text-slate-500">Overall Monthly Pocket Money Cap</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {currency}{overall.spent.toLocaleString()} / {currency}{overall.amount.toLocaleString()}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Remaining Room:</span>
                <span
                  className={`text-sm font-bold font-mono tabular-nums ${
                    overall.remaining > 0 ? 'text-teal-700' : 'text-rose-600'
                  }`}
                >
                  {currency}{overall.remaining.toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingCategory('Overall');
                  setEditingAmount(overall.amount);
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors"
              >
                Adjust Cap
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  overall.percentage >= 100
                    ? 'bg-rose-500'
                    : overall.percentage >= 90
                    ? 'bg-amber-500'
                    : overall.percentage >= 75
                    ? 'bg-amber-400'
                    : 'bg-teal-500'
                }`}
                style={{ width: `${Math.min(100, overall.percentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
              <span>0%</span>
              <span className="font-semibold text-slate-700">{overall.percentage}% Consumed</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      )}

      {/* Category Budgets Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900">
            Category Breakdown Limits ({categoryBudgets.length})
          </h2>
          <span className="text-xs text-slate-400">
            Automated alerts triggered at 75%, 90%, and 100%
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-slate-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : categoryBudgets.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">No Category Budgets Configured</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Setting category limits for Food, Transport, and Shopping ensures you catch overspending before pocket money runs out.
            </p>
            <button
              onClick={() => {
                setEditingCategory(undefined);
                setEditingAmount(undefined);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors"
            >
              + Set First Category Limit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryBudgets.map(b => (
              <div
                key={b.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{b.category}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Month: {b.month}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {b.alertLevel === 'danger' && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          <AlertOctagon className="w-3 h-3" /> Exceeded
                        </span>
                      )}
                      {b.alertLevel === 'warning' && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> 90% Warning
                        </span>
                      )}
                      {b.alertLevel === 'caution' && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                          <AlertTriangle className="w-3 h-3" /> 75% Alert
                        </span>
                      )}
                      {b.alertLevel === 'normal' && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> On Track
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Spent:</span>
                      <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                        {currency}{b.spent.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Budget:</span>
                      <span className="text-xs font-semibold text-slate-600 font-mono tabular-nums">
                        {currency}{b.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        b.percentage >= 100
                          ? 'bg-rose-500'
                          : b.percentage >= 90
                          ? 'bg-amber-500'
                          : b.percentage >= 75
                          ? 'bg-amber-400'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5 font-mono tabular-nums">
                    <span>{b.percentage}% used</span>
                    <span>
                      {b.remaining > 0
                        ? `${currency}${b.remaining.toLocaleString()} left`
                        : `${currency}${Math.abs(b.spent - b.amount).toLocaleString()} over limit`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setEditingCategory(b.category);
                      setEditingAmount(b.amount);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit budget"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(b.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Remove budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveBudget}
        initialCategory={editingCategory}
        initialAmount={editingAmount}
        initialMonth={month}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Budget Limit"
        message="Are you sure you want to remove this category budget limit? Spending in this category will no longer trigger threshold notifications."
        confirmLabel="Remove"
        isDestructive={true}
      />
    </div>
  );
};
