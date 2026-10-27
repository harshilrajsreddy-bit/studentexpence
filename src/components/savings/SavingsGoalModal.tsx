import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.tsx';
import { SavingsGoal } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    target_amount: number;
    saved_amount?: number;
    deadline?: string;
  }) => Promise<void>;
  initialData?: SavingsGoal | null;
}

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setTargetAmount(String(initialData.target_amount));
      setSavedAmount(String(initialData.saved_amount));
      setDeadline(initialData.deadline || '');
    } else {
      setTitle('');
      setTargetAmount('');
      setSavedAmount('0');
      setDeadline('');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Goal title is required.');
      return;
    }

    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Please enter a valid positive target amount.');
      return;
    }

    const parsedSaved = parseFloat(savedAmount) || 0;

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        target_amount: parsedTarget,
        saved_amount: parsedSaved,
        deadline: deadline || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save savings goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Savings Goal' : 'Create Savings Goal'}
      subtitle="Track your student savings milestones (e.g. Laptop, Trip, Emergency fund)"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Goal Title
          </label>
          <input
            type="text"
            placeholder="e.g. Coding Laptop, Goa Trip, Emergency Fund"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Amount ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="1"
                min="1"
                placeholder="5000"
                value={targetAmount}
                onChange={e => setTargetAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tabular-nums"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Already Saved ({currency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                {currency}
              </span>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="0"
                value={savedAmount}
                onChange={e => setSavedAmount(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tabular-nums"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Target Completion Deadline (Optional)
          </label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : initialData ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
