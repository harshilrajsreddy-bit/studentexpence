import React, { useState } from 'react';
import { Modal } from '../common/Modal.tsx';
import { SavingsGoal } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  onSubmit: (goalId: string, amount: number, mode: 'add' | 'withdraw') => Promise<void>;
}

export const ContributeModal: React.FC<ContributeModalProps> = ({
  isOpen,
  onClose,
  goal,
  onSubmit
}) => {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  const [mode, setMode] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setError('Please enter a valid positive contribution amount.');
      return;
    }

    if (mode === 'withdraw' && parsed > goal.saved_amount) {
      setError(`Cannot withdraw more than currently saved (${currency}${goal.saved_amount.toLocaleString()}).`);
      return;
    }

    try {
      setLoading(true);
      await onSubmit(goal.id, parsed, mode);
      setAmount('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? `Contribute to ${goal.title}` : `Withdraw from ${goal.title}`}
      subtitle={`Currently saved: ${currency}${goal.saved_amount.toLocaleString()} of ${currency}${goal.target_amount.toLocaleString()}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setMode('add')}
            className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'add' ? 'bg-white text-teal-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            + Add Funds
          </button>
          <button
            type="button"
            onClick={() => setMode('withdraw')}
            className={`py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mode === 'withdraw' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            - Withdraw Funds
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Amount ({currency})
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
              {currency}
            </span>
            <input
              type="number"
              step="1"
              min="1"
              placeholder="500"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono tabular-nums"
              required
            />
          </div>
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
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-50 ${
              mode === 'add' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {loading ? 'Processing...' : mode === 'add' ? 'Add to Goal' : 'Withdraw'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
