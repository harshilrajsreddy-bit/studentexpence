import React, { useState, useEffect } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ReportsPageProps {
  showToast: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ showToast }) => {
  const { user } = useAuth();
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchReport = async (targetMonth = month) => {
    try {
      setLoading(true);
      const data = await api.getReport(targetMonth);
      setReport(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load report', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(month);
  }, [month]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = async () => {
    try {
      await api.downloadCsv({
        startDate: `${month}-01`,
        endDate: `${month}-31`
      });
      showToast('Monthly CSV export ready', 'success');
    } catch (err: any) {
      showToast(err.message || 'CSV download failed', 'error');
    }
  };

  const currency = report?.currency || user?.currency || '₹';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header (hidden in print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
              <FileText className="w-5 h-5 text-teal-600" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Reports & Financial Statements
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Print-ready monthly expenditure summaries and filtered record statements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-200 rounded-lg bg-white shadow-2xs font-medium"
          />
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs print:border-none print:shadow-none print:p-0 space-y-6">
        {/* Printable Letterhead */}
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Student SpendSense
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monthly Student Statement · {month}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p className="font-semibold text-slate-900">{report?.userName || user?.full_name}</p>
            <p className="text-[11px] text-slate-400">Generated: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* 3 Overview Stat Panels */}
        <div className="grid grid-cols-3 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50 print:bg-white">
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Total Allowance Received</span>
            <p className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
              {currency}{(report?.totalIncome || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Total Expenses Incurred</span>
            <p className="text-lg font-bold text-rose-600 font-mono tabular-nums mt-0.5">
              {currency}{(report?.totalExpense || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Net Monthly Position</span>
            <p className={`text-lg font-bold font-mono tabular-nums mt-0.5 ${
              (report?.netSavings || 0) >= 0 ? 'text-teal-700' : 'text-rose-600'
            }`}>
              {currency}{(report?.netSavings || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Category Breakdown Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Category Breakdown Summary
          </h3>
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4 text-center">Entries</th>
                <th className="py-2.5 px-4 text-right">Share</th>
                <th className="py-2.5 px-4 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.categorySummary.map((c: any) => (
                <tr key={c.category} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-medium text-slate-800">{c.category}</td>
                  <td className="py-2.5 px-4 text-center text-slate-500">{c.count}</td>
                  <td className="py-2.5 px-4 text-right text-slate-500 font-mono tabular-nums">{c.percentage}%</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-900 font-mono tabular-nums">
                    {currency}{c.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Full Ledger Transactions */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Detailed Transactions ({report?.transactions.length || 0})
          </h3>
          <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Description</th>
                <th className="py-2 px-3">Category</th>
                <th className="py-2 px-3">Method</th>
                <th className="py-2 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report?.transactions.map((t: any) => (
                <tr key={t.id}>
                  <td className="py-2 px-3 font-mono text-slate-500">{t.transaction_date}</td>
                  <td className="py-2 px-3 font-medium text-slate-800">{t.description}</td>
                  <td className="py-2 px-3 text-slate-600">{t.category}</td>
                  <td className="py-2 px-3 text-slate-500">{t.payment_method || 'UPI'}</td>
                  <td className={`py-2 px-3 text-right font-mono font-bold tabular-nums ${
                    t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                  }`}>
                    {t.type === 'income' ? '+' : '-'} {currency}{t.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-200 pt-4 flex items-center justify-between text-[11px] text-slate-400">
          <span>Student SpendSense · Financial Records Archive</span>
          <span>Confidential Personal Student Record</span>
        </div>
      </div>
    </div>
  );
};
