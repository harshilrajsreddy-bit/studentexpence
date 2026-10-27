import React, { useState, useEffect } from 'react';
import { UserCheck, Save, RotateCcw, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';

interface ProfilePageProps {
  showToast: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ showToast }) => {
  const { user, updateProfile, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [currency, setCurrency] = useState(user?.currency || '₹');
  const [pocketMoney, setPocketMoney] = useState(String(user?.monthly_pocket_money || 8000));
  const [savingsTarget, setSavingsTarget] = useState(String(user?.savings_target || 2000));
  const [expectedDay, setExpectedDay] = useState(String(user?.expected_pocket_day || 1));
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setCurrency(user.currency || '₹');
      setPocketMoney(String(user.monthly_pocket_money || 8000));
      setSavingsTarget(String(user.savings_target || 2000));
      setExpectedDay(String(user.expected_pocket_day || 1));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile({
        full_name: fullName.trim(),
        currency,
        monthly_pocket_money: parseFloat(pocketMoney) || 0,
        savings_target: parseFloat(savingsTarget) || 0,
        expected_pocket_day: parseInt(expectedDay, 10) || 1
      });
      showToast('Profile and preferences updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDemo = async () => {
    try {
      setResetting(true);
      await api.resetDemoData();
      await refreshUser();
      showToast('Demo dataset refreshed with 30+ transactions and budgets', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset demo dataset', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
            <UserCheck className="w-5 h-5 text-teal-600" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Profile & Financial Settings
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Customize your monthly allowance, currency symbol, and pocket money arrival schedule
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email Address (Account ID)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="₹">Indian Rupee (₹)</option>
                <option value="$">US Dollar ($)</option>
                <option value="€">Euro (€)</option>
                <option value="£">British Pound (£)</option>
                <option value="¥">Japanese Yen (¥)</option>
                <option value="AED">UAE Dirham (AED)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Monthly Pocket Money ({currency})
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={pocketMoney}
                onChange={e => setPocketMoney(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Expected Allowance Day of Month
              </label>
              <select
                value={expectedDay}
                onChange={e => setExpectedDay(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>
                    Day {day} of every month
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Monthly Savings Target ({currency})
            </label>
            <input
              type="number"
              step="1"
              min="0"
              value={savingsTarget}
              onChange={e => setSavingsTarget(e.target.value)}
              className="w-full max-w-xs px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Used in dashboard savings calculations and survival recommendations
            </p>
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Demo Account & Temporary Storage Tools Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold text-slate-900">
            Temporary Storage & Presentation Toolkit
          </h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Student SpendSense is operating in <strong>volatile temporary storage (in-memory RAM)</strong>.
          No persistent database files are stored on disk. All records live in temporary application memory.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={handleResetDemo}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>{resetting ? 'Resetting dataset...' : 'Reset Demo Dataset (Aarav Sharma)'}</span>
          </button>

          <button
            onClick={async () => {
              try {
                setResetting(true);
                await api.purgeTempStorage();
                showToast('Temporary in-memory storage wiped and re-initialized', 'info');
                await refreshUser();
              } catch (err: any) {
                showToast(err.message || 'Failed to purge temporary storage', 'error');
              } finally {
                setResetting(false);
              }
            }}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200/60 disabled:opacity-50"
          >
            <span>Purge All Temporary Memory</span>
          </button>
        </div>
      </div>
    </div>
  );
};
