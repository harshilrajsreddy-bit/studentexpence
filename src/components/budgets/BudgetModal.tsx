import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.tsx';
import { EXPENSE_CATEGORIES } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (category: string, amount: number, month: string) => Promise<void>;
  initialCategory?: string;
  initialAmount?: number;
  initialMonth?: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialCategory,
  initialAmount,
  initialMonth
}) => {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  const nowMonth = new Date().toISOString().slice(0, 7);
  const [category, setCategory] = useState<string>(initialCategory || 'Overall');
  const [amount, setAmount] = useState<string>(initialAmount ? String(initialAmount) : '');
  const [month, setMonth] = useState<string>(initialMonth || nowMonth);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCategory(initialCategory || 'Overall');
      setAmount(initialAmount ? String(initialAmount) : '');
      setMonth(initialMonth || nowMonth);
      setError('');
    }
  }, [isOpen, initialCategory, initialAmount, initialMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid positive budget amount.');
      return;
    }

    try {
      setLoading(true);
      await onSubmit(category, parsedAmount, month);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget limit');
    } finally {
      setLoading(false);
    }
  };

  const budgetOptions = ['Overall', ...EXPENSE_CATEGORIES];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Budget Limit"
      subtitle="Define monthly spending cap to activate automated 75%, 90%, and 100% threshold alerts"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Budget Scope / Category
          </label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            disabled={Boolean(initialCategory)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
          >
            {budgetOptions.map(c => (
              <option key={c} value={c}>
                {c === 'Overall' ? 'Overall Monthly Budget (Total Pocket Money Cap)' : c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Monthly Limit Amount ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
              {currency}
            </span>
            <input
              type="number"
              step="1"
              min="1"
              placeholder="e.g. 3000"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tabular-nums"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Month
          </label>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            required
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
            {loading ? 'Saving...' : 'Set Budget'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
