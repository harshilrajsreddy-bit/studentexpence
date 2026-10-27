import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  PlusCircle,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DashboardSummary } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface DashboardPageProps {
  onQuickAdd: () => void;
  onNavigate: (tab: any) => void;
  showToast: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Food and snacks': '#0d9488', // teal-600
  'Transportation': '#3b82f6', // blue-500
  'College expenses': '#8b5cf6', // purple-500
  'Shopping': '#f59e0b', // amber-500
  'Entertainment': '#ec4899', // pink-500
  'Mobile and internet': '#06b6d4', // cyan-500
  'Health': '#10b981', // emerald-500
  'Accommodation': '#64748b', // slate-500
  'Other': '#94a3b8'
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onQuickAdd,
  onNavigate,
  showToast
}) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );

  const fetchSummary = async (month?: string) => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary(month || selectedMonth);
      setSummary(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedMonth);
  }, [selectedMonth]);

  const currency = summary?.currency || user?.currency || '₹';

  if (loading && !summary) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 animate-pulse rounded-lg w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-slate-200 animate-pulse rounded-xl" />
          <div className="h-72 bg-slate-200 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  const chartData = summary?.dailySpending.filter(d => d.amount > 0) || [];
  const pieData = summary?.categoryBreakdown || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time balance, monthly budget usage, and expense breakdown
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
          />
          <button
            onClick={() => fetchSummary(selectedMonth)}
            title="Refresh statistics"
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Threshold Alerts */}
      {summary && summary.alerts.length > 0 && (
        <div className="space-y-2">
          {summary.alerts.map(alt => (
            <div
              key={alt.id}
              className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                alt.type === 'danger'
                  ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  alt.type === 'danger' ? 'text-rose-600' : 'text-amber-600'
                }`}
              />
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-xs block leading-tight">{alt.title}</span>
                <span className="text-xs leading-normal opacity-90">{alt.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5 Core Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Pocket Money Received */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Pocket Money</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-900 tabular-nums">
            {currency}{(summary?.totalIncomeThisMonth || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Expected: {currency}{(summary?.monthlyPocketMoney || 0).toLocaleString()}
          </p>
        </div>

        {/* Card 2: Total Expenses */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Total Spent</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-rose-600 tabular-nums">
            {currency}{(summary?.totalExpensesThisMonth || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            This Month
          </p>
        </div>

        {/* Card 3: Available Balance */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Available Balance</span>
            <div className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-xl font-bold tabular-nums ${(summary?.availableBalance || 0) < 500 ? 'text-rose-600' : 'text-slate-900'}`}>
            {currency}{(summary?.availableBalance || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Current Liquid Cash
          </p>
        </div>

        {/* Card 4: Amount Saved */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Saved This Month</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-bold text-indigo-600 tabular-nums">
            {currency}{(summary?.amountSavedThisMonth || 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Net Monthly Surplus
          </p>
        </div>

        {/* Card 5: Monthly Budget Usage */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Budget Usage</span>
            <span className={`text-xs font-semibold tabular-nums ${
              (summary?.monthlyBudgetUsagePercentage || 0) >= 90
                ? 'text-rose-600'
                : (summary?.monthlyBudgetUsagePercentage || 0) >= 75
                ? 'text-amber-600'
                : 'text-teal-600'
            }`}>
              {summary?.monthlyBudgetUsagePercentage || 0}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                (summary?.monthlyBudgetUsagePercentage || 0) >= 90
                  ? 'bg-rose-500'
                  : (summary?.monthlyBudgetUsagePercentage || 0) >= 75
                  ? 'bg-amber-500'
                  : 'bg-teal-500'
              }`}
              style={{ width: `${Math.min(100, summary?.monthlyBudgetUsagePercentage || 0)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Limit: {currency}{(summary?.monthlyBudget || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Signature Highlight Banner: Pocket Money Survival Predictor */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-teal-400" />
            <h3 className="text-base sm:text-lg font-bold tracking-tight">
              Pocket Money Survival Predictor
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Wondering if your remaining pocket money will last until next allowance day?
            Our student burn-rate algorithm projects daily safe caps and runway duration.
          </p>
        </div>
        <button
          onClick={() => onNavigate('survival')}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          Open Survival Engine →
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Spending Line Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Daily Spending Rhythm
              </h2>
              <p className="text-xs text-slate-500">Expenses recorded across active month</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md tabular-nums">
              {summary?.dailySpending.filter(d => d.amount > 0).length || 0} active days
            </span>
          </div>

          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                <p>No daily expenses recorded for this month yet.</p>
                <button
                  onClick={onQuickAdd}
                  className="mt-2 text-teal-600 font-semibold hover:underline"
                >
                  + Add First Expense
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="dayLabel"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={val => `${currency}${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                    formatter={(val: any) => [`${currency}${Number(val).toLocaleString()}`, 'Spent']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#0d9488"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#0d9488' }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Breakdown Doughnut Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col">
          <div className="mb-3">
            <h2 className="text-sm font-bold text-slate-900">
              Category Distribution
            </h2>
            <p className="text-xs text-slate-500">Share of monthly student spending</p>
          </div>

          <div className="h-48 w-full relative flex items-center justify-center">
            {pieData.length === 0 ? (
              <p className="text-xs text-slate-400">No expenses recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {pieData.map(entry => (
                      <Cell
                        key={`cell-${entry.category}`}
                        fill={CATEGORY_COLORS[entry.category] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      border: 'none'
                    }}
                    formatter={(val: any) => [`${currency}${Number(val).toLocaleString()}`, 'Spent']}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Clean unboxed category list */}
          <div className="space-y-1.5 mt-2 flex-1 overflow-y-auto max-h-36">
            {pieData.slice(0, 4).map(cat => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-xs"
                    style={{ backgroundColor: CATEGORY_COLORS[cat.category] || '#94a3b8' }}
                  />
                  <span className="text-slate-700 truncate">{cat.category}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 font-mono tabular-nums">
                  <span>{currency}{cat.amount.toLocaleString()}</span>
                  <span className="text-slate-400">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Budget Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Budget Progress */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Budget Progress</h2>
              <p className="text-xs text-slate-500">Limits vs current outlays</p>
            </div>
            <button
              onClick={() => onNavigate('budgets')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
            >
              Manage
            </button>
          </div>

          {summary?.budgetProgress.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              <p>No category budgets defined for this month.</p>
              <button
                onClick={() => onNavigate('budgets')}
                className="mt-2 text-teal-600 font-semibold hover:underline"
              >
                + Set Category Budgets
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {summary?.budgetProgress.slice(0, 4).map(bp => (
                <div key={bp.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{bp.category}</span>
                    <span className="text-slate-500 font-mono tabular-nums">
                      {currency}{bp.spent.toLocaleString()} / {currency}{bp.budgeted.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        bp.status === 'danger'
                          ? 'bg-rose-500'
                          : bp.status === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-teal-500'
                      }`}
                      style={{ width: `${Math.min(100, bp.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-500">Latest expenses and deposits</p>
            </div>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold"
            >
              View All ({summary?.recentTransactions.length || 0})
            </button>
          </div>

          {summary?.recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No transactions logged yet. Click Quick Add to log your first student record.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {summary?.recentTransactions.map(t => (
                <div
                  key={t.id}
                  className="py-2.5 flex items-center justify-between hover:bg-slate-50/50 rounded-lg px-2 -mx-2 transition-colors"
                >
                  <div className="min-w-0 flex-1 mr-4">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {t.description}
                      </p>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-[11px] text-slate-500">{t.category}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {t.transaction_date} · {t.payment_method || 'UPI'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-bold font-mono tabular-nums ${
                        t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {t.type === 'income' ? '+' : '-'} {currency}{t.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
