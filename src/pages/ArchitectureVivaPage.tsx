import React from 'react';
import {
  Code2,
  Database,
  ShieldCheck,
  Compass,
  Cpu,
  Layers,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const ArchitectureVivaPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
            <Code2 className="w-5 h-5 text-teal-600" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            System Architecture & College Project Viva Guide
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Technical specifications, database schemas, Row Level Security (RLS) policies, and mathematical algorithms
        </p>
      </div>

      {/* Section 1: Executive Technical Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Layers className="w-4 h-4 text-teal-600" />
          <span>1. Full-Stack System Architecture</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Student SpendSense is designed with a strictly decoupled 3-tier architecture that guarantees both immediate
          local execution and turnkey cloud deployment to Supabase and PostgreSQL.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-900 block">Frontend Tier</span>
            <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li>React 19 + Vite (Fast SPA)</li>
              <li>Tailwind CSS + Plus Jakarta Sans</li>
              <li>Recharts dynamic line & doughnut charts</li>
              <li>Zod schemas for form verification</li>
              <li>Lucide React contextual iconography</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-900 block">Backend Tier</span>
            <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li>Node.js + Express.js REST API</li>
              <li>JWT session token authentication</li>
              <li>Bcryptjs salted password hashing</li>
              <li>CalculationService financial engine</li>
              <li>Strict user ID isolation middleware</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-xs font-bold text-slate-900 block">Database Tier</span>
            <ul className="text-xs text-slate-600 mt-2 space-y-1 list-disc list-inside">
              <li>PostgreSQL / Supabase Schema ready</li>
              <li>Row Level Security (RLS) policies</li>
              <li>Volatile Temporary In-Memory Storage (RAM)</li>
              <li>Zero float rounding errors (cents math)</li>
              <li>Foreign key cascade constraints</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section 2: Signature Feature Algorithm: Survival Predictor */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Compass className="w-4 h-4 text-teal-600" />
          <span>2. Pocket Money Survival Predictor — Mathematical Formulation</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Unlike ordinary trackers that only tally expenses, Student SpendSense models the student's dynamic burn rate
          over a user-selected historical window (14, 30, 45, or 60 days).
        </p>

        <div className="p-4 bg-slate-900 text-teal-300 rounded-xl font-mono text-xs space-y-2.5 overflow-x-auto">
          <p className="text-slate-400"># 1. Eligible Historical Expenses (excludes income and future transactions)</p>
          <p>E_eligible = Sum(amount_i for t_i in [now - T_days, now] where type == 'expense')</p>
          <p className="text-slate-400"># 2. Average Daily Spending (Burn Rate)</p>
          <p>BurnRate_daily = E_eligible / T_days</p>
          <p className="text-slate-400"># 3. Estimated Days Remaining (Runway)</p>
          <p>Runway_days = floor(CurrentAvailableBalance / BurnRate_daily) [if BurnRate &gt; 0 else inf]</p>
          <p className="text-slate-400"># 4. Projected Balance on Next Pocket Money Date</p>
          <p>NextDateBalance = CurrentAvailableBalance - (BurnRate_daily * DaysUntilNextAllowance)</p>
          <p className="text-slate-400"># 5. Suggested Maximum Daily Spending Cap</p>
          <p>SuggestedDailyCap = max(0, CurrentAvailableBalance / DaysUntilNextAllowance)</p>
        </div>

        <div className="space-y-2 pt-2 text-xs text-slate-700">
          <span className="font-bold text-slate-900 block">Critical Edge Case Safeguards:</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="font-semibold text-slate-800">Zero Spending / Divide-by-Zero:</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                If no expenses are logged, burn rate is 0. Runway displays "Insufficient Data" rather than causing a division by zero error (NaN/Infinity).
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
              <span className="font-semibold text-slate-800">Deficit Prevention:</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                If NextDateBalance is negative, a critical Deficit Warning is displayed showing the exact projected shortfall and how many days early money runs out.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Supabase PostgreSQL Schema & Row Level Security (RLS) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>3. Database Security & Row Level Security (RLS)</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          The project includes an enterprise-ready PostgreSQL migration file located at <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-700 font-mono">/supabase/migrations/20261026_init.sql</code>.
          Authorization is enforced at the database kernel level through Row Level Security (RLS), preventing cross-tenant data leaks.
        </p>

        <div className="p-4 bg-slate-900 text-teal-300 rounded-xl font-mono text-xs space-y-2 overflow-x-auto">
          <p className="text-slate-400">-- Example RLS Policy enforcing User Data Isolation</p>
          <p>ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;</p>
          <p>CREATE POLICY "Users can view own transactions"</p>
          <p>&nbsp;&nbsp;ON public.transactions FOR SELECT</p>
          <p>&nbsp;&nbsp;USING (auth.uid() = user_id);</p>
          <p>CREATE POLICY "Users can insert own transactions"</p>
          <p>&nbsp;&nbsp;ON public.transactions FOR INSERT</p>
          <p>&nbsp;&nbsp;WITH CHECK (auth.uid() = user_id);</p>
        </div>
      </div>

      {/* Section 4: Sample Questions for Project Evaluation / Viva */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Cpu className="w-4 h-4 text-teal-600" />
          <span>4. Quick Viva Q&A Reference</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="font-bold text-slate-900 block">
              Q: Why is Student SpendSense different from generic budget apps?
            </span>
            <p className="text-slate-600 mt-1">
              A: Standard expense trackers only show where money went in the past. SpendSense includes the Pocket Money Survival Predictor, which analyzes historical burn rate to forecast if student funds will last until the next allowance day, providing an actionable daily cap to prevent going broke.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="font-bold text-slate-900 block">
              Q: How does the app ensure financial arithmetic precision?
            </span>
            <p className="text-slate-600 mt-1">
              A: Amounts are sanitized and rounded to 2 decimal places using numeric cents formatting. In the database schema, we use <code className="font-mono text-teal-700">NUMERIC(12, 2)</code> rather than IEEE-754 binary floating-point numbers, avoiding rounding artifacts.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="font-bold text-slate-900 block">
              Q: How is demo data kept separate from real user accounts?
            </span>
            <p className="text-slate-600 mt-1">
              A: Demo data is assigned to a dedicated fixed UUID (<code className="font-mono text-teal-700">00000000-0000-0000-0000-000000000001</code>). When a real user registers with their email, a unique UUID is generated. All queries strictly filter by <code className="font-mono text-teal-700">user_id = req.user.id</code>, guaranteeing zero data leakage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
