import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  Trash2,
  Edit2,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { SavingsGoal } from '../types/index.ts';
import { api } from '../services/api.ts';
import { SavingsGoalModal } from '../components/savings/SavingsGoalModal.tsx';
import { ContributeModal } from '../components/savings/ContributeModal.tsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface SavingsPageProps {
  showToast: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const SavingsPage: React.FC<SavingsPageProps> = ({ showToast }) => {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  const [activeGoals, setActiveGoals] = useState<SavingsGoal[]>([]);
  const [completedGoals, setCompletedGoals] = useState<SavingsGoal[]>([]);
  const [stats, setStats] = useState({
    totalTarget: 0,
    totalSaved: 0,
    overallPercentage: 0,
    activeCount: 0,
    completedCount: 0
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await api.getSavingsGoals();
      setActiveGoals(data.activeGoals);
      setCompletedGoals(data.completedGoals);
      setStats(data.stats);
    } catch (err: any) {
      showToast(err.message || 'Failed to load savings goals', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleSaveGoal = async (data: any) => {
    try {
      if (editingGoal) {
        await api.updateSavingsGoal(editingGoal.id, data);
        showToast('Savings goal updated', 'success');
      } else {
        await api.createSavingsGoal(data);
        showToast('Savings goal created', 'success');
      }
      fetchGoals();
    } catch (err: any) {
      showToast(err.message || 'Failed to save savings goal', 'error');
      throw err;
    }
  };

  const handleContribute = async (goalId: string, amount: number, mode: 'add' | 'withdraw') => {
    try {
      await api.contributeSavingsGoal(goalId, amount, mode);
      showToast(
        mode === 'add'
          ? `Added ${currency}${amount.toLocaleString()} to goal`
          : `Withdrew ${currency}${amount.toLocaleString()} from goal`,
        'success'
      );
      fetchGoals();
    } catch (err: any) {
      showToast(err.message || 'Failed to process contribution', 'error');
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await api.deleteSavingsGoal(deletingId);
      showToast('Savings goal deleted', 'success');
      setDeletingId(null);
      fetchGoals();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete goal', 'error');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
              <Target className="w-5 h-5 text-teal-600" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Savings Goals
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Set student targets for laptops, books, trips, and emergency funds with periodic milestone tracking
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsGoalModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Target</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <span className="text-xs text-slate-500 block">Total Stashed in Goals</span>
            <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1">
              {currency}{stats.totalSaved.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-400">
              Across {stats.activeCount + stats.completedCount} total goals
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-500 block">Aggregate Target</span>
            <p className="text-2xl font-bold text-teal-700 font-mono tabular-nums mt-1">
              {currency}{stats.totalTarget.toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-400">
              {stats.completedCount} completed milestones
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-500">Overall Progress</span>
              <span className="font-bold text-slate-800 font-mono tabular-nums">
                {stats.overallPercentage}%
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-teal-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, stats.overallPercentage)}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Remaining: {currency}{(Math.max(0, stats.totalTarget - stats.totalSaved)).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Active Goals Section */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-4">
          Active Student Goals ({activeGoals.length})
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : activeGoals.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-400">
            No active savings goals yet. Create a goal like "Coding Laptop" or "Semester Trip".
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeGoals.map(goal => (
              <div
                key={goal.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {goal.title}
                      </h3>
                      {goal.deadline && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Deadline: {goal.deadline}</span>
                          {goal.days_remaining !== null && (
                            <span className="text-slate-400">({goal.days_remaining}d left)</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingGoal(goal);
                          setIsGoalModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Edit goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(goal.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Saved:</span>
                      <span className="text-lg font-bold text-slate-900 font-mono tabular-nums">
                        {currency}{goal.saved_amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Target:</span>
                      <span className="text-xs font-semibold text-slate-600 font-mono tabular-nums">
                        {currency}{goal.target_amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-teal-600 transition-all duration-300"
                      style={{ width: `${Math.min(100, goal.percentage)}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1.5 font-mono tabular-nums">
                    <span>{goal.percentage}% saved</span>
                    <span>{currency}{goal.remaining_amount.toLocaleString()} remaining</span>
                  </div>

                  {/* Suggested periodic contribution */}
                  {goal.suggested_monthly_contribution && goal.suggested_monthly_contribution > 0 && (
                    <div className="mt-2.5 p-2 bg-teal-50/70 border border-teal-100 rounded-lg text-[11px] text-teal-800 flex items-center justify-between">
                      <span>Suggested Monthly Plan:</span>
                      <span className="font-bold font-mono">
                        {currency}{goal.suggested_monthly_contribution.toLocaleString()} / mo
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setContributeGoal(goal)}
                    className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                    <span>Manage Funds / Deposit</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Goals Section */}
      {completedGoals.length > 0 && (
        <div className="pt-4 border-t border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Completed Milestones ({completedGoals.length})</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGoals.map(goal => (
              <div
                key={goal.id}
                className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between shadow-2xs"
              >
                <div>
                  <h3 className="text-xs font-bold text-emerald-950">{goal.title}</h3>
                  <p className="text-[11px] text-emerald-700 font-mono tabular-nums mt-0.5">
                    Achieved: {currency}{goal.saved_amount.toLocaleString()} of {currency}{goal.target_amount.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setDeletingId(goal.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSubmit={handleSaveGoal}
        initialData={editingGoal}
      />

      <ContributeModal
        isOpen={Boolean(contributeGoal)}
        onClose={() => setContributeGoal(null)}
        goal={contributeGoal}
        onSubmit={handleContribute}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Savings Goal"
        message="Are you sure you want to delete this savings goal? This will remove milestone tracking for this item."
        confirmLabel="Delete"
        isDestructive={true}
      />
    </div>
  );
};
