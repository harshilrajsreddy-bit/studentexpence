import React, { useState, useEffect } from 'react';
import {
  Compass,
  Calendar,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Sliders,
  DollarSign,
  TrendingDown,
  Info
} from 'lucide-react';
import { SurvivalPrediction } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface SurvivalPredictorPageProps {
  showToast: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
  onNavigate: (tab: any) => void;
}

export const SurvivalPredictorPage: React.FC<SurvivalPredictorPageProps> = ({
  showToast,
  onNavigate
}) => {
  const { user } = useAuth();
  const [historicalDays, setHistoricalDays] = useState<number>(30);
  const [customTargetDate, setCustomTargetDate] = useState<string>('');
  const [prediction, setPrediction] = useState<SurvivalPrediction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // What-if simulator state
  const [simulatedDailySpend, setSimulatedDailySpend] = useState<number>(0);

  const fetchPrediction = async (days = historicalDays, targetDate = customTargetDate) => {
    try {
      setLoading(true);
      const data = await api.getSurvivalPrediction(days, targetDate || undefined);
      setPrediction(data);
      setSimulatedDailySpend(Math.round(data.averageDailySpending));
    } catch (err: any) {
      showToast(err.message || 'Failed to compute survival prediction', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction(historicalDays, customTargetDate);
  }, [historicalDays, customTargetDate]);

  const currency = prediction?.currency || user?.currency || '₹';

  // What-if simulator calculations
  const simDaysRemaining =
    simulatedDailySpend > 0 && prediction && prediction.currentBalance > 0
      ? Math.floor(prediction.currentBalance / simulatedDailySpend)
      : 0;

  const simProjectedEndBalance =
    prediction
      ? Math.round(prediction.currentBalance - (simulatedDailySpend * prediction.daysUntilNextPocketMoney))
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
              <Compass className="w-5 h-5 text-teal-600" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Pocket Money Survival Predictor
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Algorithmic burn-rate analysis predicting whether your pocket money will last until next allowance day
          </p>
        </div>

        {/* Historical Window Filter Tabs */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
            History Period:
          </span>
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg text-xs font-medium">
            {[14, 30, 45, 60].map(days => (
              <button
                key={days}
                onClick={() => setHistoricalDays(days)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  historicalDays === days
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Target Allowance Date Selector */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-teal-600 shrink-0" />
          <div>
            <h2 className="text-xs font-bold text-slate-900">
              Next Pocket Money Date
            </h2>
            <p className="text-[11px] text-slate-500">
              {prediction?.expectedNextDate
                ? `Calculated arrival date: ${prediction.expectedNextDate} (${prediction.daysUntilNextPocketMoney} days remaining)`
                : 'Select your expected pocket money day'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Override Date:
          </label>
          <input
            type="date"
            value={customTargetDate}
            onChange={e => setCustomTargetDate(e.target.value)}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          {customTargetDate && (
            <button
              onClick={() => setCustomTargetDate('')}
              className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {loading && !prediction ? (
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
      ) : prediction?.sustainabilityStatus === 'insufficient_data' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Insufficient Historical Expenses
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              The Survival Predictor requires recorded expenses in the past {historicalDays} days to determine your daily burn rate.
            </p>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-700 transition-colors"
          >
            Go to Transactions Ledger & Add Records
          </button>
        </div>
      ) : (
        <>
          {/* Main Status Verdict Banner */}
          <div
            className={`rounded-2xl p-6 border shadow-sm ${
              prediction?.sustainabilityStatus === 'critical'
                ? 'bg-rose-50/90 border-rose-200 text-rose-950'
                : prediction?.sustainabilityStatus === 'caution'
                ? 'bg-amber-50/90 border-amber-200 text-amber-950'
                : 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-full shrink-0 ${
                    prediction?.sustainabilityStatus === 'critical'
                      ? 'bg-rose-100 text-rose-600'
                      : prediction?.sustainabilityStatus === 'caution'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}
                >
                  {prediction?.sustainabilityStatus === 'critical' ? (
                    <AlertOctagon className="w-8 h-8" />
                  ) : prediction?.sustainabilityStatus === 'caution' ? (
                    <AlertTriangle className="w-8 h-8" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80">
                      {prediction?.sustainabilityStatus === 'critical'
                        ? 'Deficit Warning'
                        : prediction?.sustainabilityStatus === 'caution'
                        ? 'Tight Runway'
                        : 'Sustainable Pacing'}
                    </span>
                    <span className="text-xs text-slate-500">
                      · Next arrival in {prediction?.daysUntilNextPocketMoney} days
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold mt-1 tracking-tight">
                    {prediction?.sustainabilityStatus === 'critical'
                      ? `Projected Shortfall of ${currency}${Math.abs(
                          prediction?.projectedNextDateBalance || 0
                        ).toLocaleString()} before next pocket money`
                      : prediction?.sustainabilityStatus === 'caution'
                      ? `Projected tight balance of ${currency}${(
                          prediction?.projectedNextDateBalance || 0
                        ).toLocaleString()} on next pocket money date`
                      : `Projected healthy surplus of ${currency}${(
                          prediction?.projectedNextDateBalance || 0
                        ).toLocaleString()} on next pocket money date`}
                  </h2>

                  <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                    At your current burn rate of <strong className="font-semibold">{currency}{prediction?.averageDailySpending.toFixed(0)}/day</strong>,
                    your available balance of <strong className="font-semibold">{currency}{(prediction?.currentBalance || 0).toLocaleString()}</strong> will last{' '}
                    <strong className="font-semibold">{prediction?.estimatedDaysRemaining} days</strong>.
                  </p>
                </div>
              </div>

              {/* Safe Daily Cap Highlight Box */}
              <div className="bg-white/90 rounded-xl p-4 border border-slate-200/80 min-w-[200px] text-center md:text-right shadow-2xs">
                <span className="text-[11px] font-semibold text-slate-500 uppercase block">
                  Suggested Safe Daily Cap
                </span>
                <span className="text-2xl font-bold text-teal-700 font-mono tabular-nums block mt-0.5">
                  {currency}{prediction?.suggestedMaxDailyLimit.toFixed(0)}
                  <span className="text-xs font-normal text-slate-500"> / day</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Guarantees funds until {prediction?.expectedNextDate}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Current Balance</span>
                <DollarSign className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {currency}{(prediction?.currentBalance || 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Total liquid funds
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Avg Daily Burn</span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-xl font-bold text-rose-600 font-mono tabular-nums">
                {currency}{prediction?.averageDailySpending.toFixed(1)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Across past {historicalDays} days ({prediction?.eligibleExpensesCount} records)
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Runway Duration</span>
                <Compass className="w-4 h-4 text-indigo-500" />
              </div>
              <p className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {prediction?.estimatedDaysRemaining} Days
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Target: {prediction?.daysUntilNextPocketMoney} days
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Discretionary Share</span>
                <span className="text-[11px] font-bold text-slate-700">
                  {prediction?.discretionarySpendingShare}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 my-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${prediction?.discretionarySpendingShare || 0}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Food & snacks, entertainment, shopping
              </p>
            </div>
          </div>

          {/* Interactive What-If Simulator & Actionable Advice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* What-If Daily Spending Slider */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-teal-600" />
                    <h2 className="text-sm font-bold text-slate-900">
                      What-If Spending Simulator
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Drag the slider to see how adjusting your daily spending alters your month-end cash
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">Simulated Daily Budget:</span>
                  <span className="font-bold text-slate-900 text-sm font-mono tabular-nums">
                    {currency}{simulatedDailySpend} / day
                  </span>
                </div>

                <input
                  type="range"
                  min="20"
                  max={Math.max(800, Math.round((prediction?.averageDailySpending || 200) * 2.5))}
                  step="10"
                  value={simulatedDailySpend}
                  onChange={e => setSimulatedDailySpend(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-600 cursor-pointer"
                />

                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Frugal ({currency}50)</span>
                  <span>Current Avg ({currency}{Math.round(prediction?.averageDailySpending || 0)})</span>
                  <span>High Spend</span>
                </div>
              </div>

              {/* Simulation Result Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Estimated Runway Duration:</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    {simDaysRemaining} Days
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Balance on Next Pocket Money Date:</span>
                  <span
                    className={`font-bold font-mono tabular-nums ${
                      simProjectedEndBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {currency}{simProjectedEndBalance.toLocaleString()}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  {simProjectedEndBalance >= 0
                    ? `At ${currency}${simulatedDailySpend}/day, you will survive until next allowance day with a ${currency}${simProjectedEndBalance} safety reserve.`
                    : `At ${currency}${simulatedDailySpend}/day, your balance will deplete ${Math.abs(Math.round(simProjectedEndBalance / (simulatedDailySpend || 1)))} days early.`}
                </p>
              </div>
            </div>

            {/* Algorithmic Recommendations */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Personalized Student Action Plan
                </h2>
              </div>

              <div className="space-y-2.5">
                {prediction?.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5"
                  >
                    <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>

              {/* Mathematical Disclaimer */}
              <p className="text-[11px] text-slate-400 italic pt-2">
                * Note: Figures are mathematical projections based on historical transactions, not guarantees. Unexpected one-time expenses or deposits alter daily estimates.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
