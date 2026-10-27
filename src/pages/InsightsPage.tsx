import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  Award,
  Sparkles,
  Zap,
  ArrowRight
} from 'lucide-react';
import { SpendingInsights } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface InsightsPageProps {
  showToast: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigate: (tab: any) => void;
}

export const InsightsPage: React.FC<InsightsPageProps> = ({ showToast, onNavigate }) => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<SpendingInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const data = await api.getSpendingInsights();
      setInsights(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load insights', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const currency = insights?.currency || user?.currency || '₹';

  if (loading && !insights) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 bg-slate-200 animate-pulse rounded-lg w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-200 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
            <Lightbulb className="w-5 h-5 text-teal-600" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Spending Insights & Habit Analytics
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Rule-based financial behavior analysis derived directly from your recorded student transactions
        </p>
      </div>

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Highest Category */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Primary Expense Drain</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 truncate">
            {insights?.highestCategory?.category || 'None yet'}
          </p>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 font-mono tabular-nums">
            <span>{currency}{(insights?.highestCategory?.amount || 0).toLocaleString()}</span>
            <span className="text-teal-700 font-semibold">{insights?.highestCategory?.percentage || 0}% of all spend</span>
          </div>
        </div>

        {/* Average Daily Spend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Current Month Daily Average</span>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {currency}{(insights?.averageDailySpending || 0).toFixed(1)}
            <span className="text-xs font-normal text-slate-400"> / day</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            Calculated across days elapsed this month
          </p>
        </div>

        {/* Most Expensive Single Transaction */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span>Largest Outlay</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-bold text-rose-600 font-mono tabular-nums">
            {insights?.mostExpensiveTransaction
              ? `${currency}${insights.mostExpensiveTransaction.amount.toLocaleString()}`
              : 'None'}
          </p>
          <p className="text-[11px] text-slate-500 truncate mt-2">
            {insights?.mostExpensiveTransaction?.description || 'No expenses logged'}
          </p>
        </div>
      </div>

      {/* Weekday vs Weekend & Month-over-Month Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekday vs Weekend Spending Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Weekday vs Weekend Spending
              </h2>
              <p className="text-xs text-slate-500">Student leisure & hangout impact</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Weekdays (Mon–Fri)</span>
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {currency}{insights?.weekdayVsWeekend.weekdayDailyAvg}
                <span className="text-[11px] text-slate-400 font-normal"> / day</span>
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                Total: {currency}{insights?.weekdayVsWeekend.weekdayTotal.toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Weekends (Sat–Sun)</span>
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {currency}{insights?.weekdayVsWeekend.weekendDailyAvg}
                <span className="text-[11px] text-slate-400 font-normal"> / day</span>
              </p>
              <span className="text-[11px] text-slate-400 block mt-1">
                Total: {currency}{insights?.weekdayVsWeekend.weekendTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-3 bg-teal-50/70 border border-teal-100 rounded-lg text-xs text-teal-900 leading-relaxed">
            {insights?.weekdayVsWeekend.weekendHigher ? (
              <span>
                🎯 Your weekend daily rate is{' '}
                <strong className="font-semibold">{insights?.weekdayVsWeekend.percentageDifference}% higher</strong> than weekdays.
                College students frequently overspend on weekend dining and movies.
              </span>
            ) : (
              <span>
                🎯 Your weekend spending remains disciplined and comparable to your standard weekday study schedule.
              </span>
            )}
          </div>
        </div>

        {/* Month-over-Month Comparison */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Month-over-Month Trend
              </h2>
              <p className="text-xs text-slate-500">Comparison with previous 30-day period</p>
            </div>
            {insights?.monthlyComparison.trend === 'increased' ? (
              <TrendingUp className="w-4 h-4 text-rose-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-emerald-500" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Current Month Total</span>
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {currency}{(insights?.monthlyComparison.currentMonthTotal || 0).toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 block">Previous Month Total</span>
              <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {currency}{(insights?.monthlyComparison.previousMonthTotal || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 leading-relaxed">
            <p className="font-semibold">{insights?.monthlyComparison.insightText}</p>
          </div>
        </div>
      </div>

      {/* Personalized Student Saving Tips */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Personalized Savings Opportunities
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights?.personalizedTips.map((tip, i) => (
            <div
              key={i}
              className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">{tip.title}</h3>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                    tip.impact === 'high'
                      ? 'bg-rose-100 text-rose-800'
                      : tip.impact === 'medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-teal-100 text-teal-800'
                  }`}
                >
                  {tip.impact} impact
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{tip.advice}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Warnings */}
      {insights && insights.categoryWarnings.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-4 h-4" />
            <h2 className="text-sm font-bold">Category Limit Advisories</h2>
          </div>

          <div className="space-y-2">
            {insights.categoryWarnings.map((w, i) => (
              <div
                key={i}
                className="p-3 bg-rose-50/60 rounded-lg border border-rose-100 text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900">{w.category}: </span>
                  <span className="text-slate-600">{w.message}</span>
                </div>
                <button
                  onClick={() => onNavigate('budgets')}
                  className="text-teal-700 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                >
                  Adjust Budget <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
