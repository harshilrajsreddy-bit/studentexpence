import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import {
  Transaction,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES
} from '../types/index.ts';
import { api } from '../services/api.ts';
import { TransactionModal } from '../components/transactions/TransactionModal.tsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface TransactionsPageProps {
  showToast: (msg: string, type: 'success' | 'warning' | 'error' | 'info') => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({ showToast }) => {
  const { user } = useAuth();
  const currency = user?.currency || '₹';

  // Filters & State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalCount: 0, limit: 20 });
  const [filteredTotals, setFilteredTotals] = useState({ totalIncome: 0, totalExpense: 0, netBalance: 0 });

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getTransactions({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 20
      });
      setTransactions(data.transactions);
      setPagination({
        totalPages: data.pagination.totalPages,
        totalCount: data.pagination.totalCount,
        limit: data.pagination.limit
      });
      setFilteredTotals(data.filteredTotals);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, categoryFilter, sortBy, sortOrder, page, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const handleSaveTransaction = async (data: any) => {
    try {
      if (editingTransaction) {
        await api.updateTransaction(editingTransaction.id, data);
        showToast('Transaction updated successfully', 'success');
      } else {
        await api.createTransaction(data);
        showToast('Transaction recorded successfully', 'success');
      }
      fetchTransactions();
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
      throw err;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await api.deleteTransaction(deletingId);
      showToast('Transaction deleted', 'success');
      setDeletingId(null);
      fetchTransactions();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  };

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      await api.downloadCsv({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      showToast('CSV downloaded successfully', 'success');
    } catch (err: any) {
      showToast(err.message || 'CSV export failed', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Transactions Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full history of your student expenses, allowances, and deposits
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            disabled={isExporting || transactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
          <button
            onClick={() => {
              setEditingTransaction(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description or note..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </form>

          {/* Type Filter */}
          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={e => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={categoryFilter}
              onChange={e => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
            >
              <option value="all">All Categories</option>
              {allCategories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-3 flex items-center gap-2">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-700"
            >
              <option value="date">Sort: Date</option>
              <option value="amount">Sort: Amount</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
              title="Toggle sort direction"
              className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors text-slate-700"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Date Range Sub-Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 border border-slate-200 rounded text-slate-700 focus:outline-none"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 border border-slate-200 rounded text-slate-700 focus:outline-none"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-teal-600 hover:underline ml-1"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filtered Balance Strip */}
          <div className="flex items-center gap-3 font-mono tabular-nums text-xs">
            <span className="text-emerald-700 font-semibold">
              + {currency}{filteredTotals.totalIncome.toLocaleString()}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-rose-600 font-semibold">
              - {currency}{filteredTotals.totalExpense.toLocaleString()}
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-700 font-bold">
              Net: {currency}{filteredTotals.netBalance.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
            Loading transactions...
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-700">No transactions match your filters</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try adjusting your search terms, date range, or record a new transaction.
            </p>
            <button
              onClick={() => {
                setTypeFilter('all');
                setCategoryFilter('all');
                setSearchQuery('');
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs font-semibold text-teal-600 hover:underline"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-mono whitespace-nowrap">
                      {t.transaction_date}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{t.description}</p>
                      {t.notes && <p className="text-[11px] text-slate-400 truncate mt-0.5">{t.notes}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {t.category}
                    </td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {t.payment_method || 'UPI'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold tabular-nums whitespace-nowrap">
                      <span className={t.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}>
                        {t.type === 'income' ? '+' : '-'} {currency}{t.amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingTransaction(t);
                            setIsModalOpen(true);
                          }}
                          title="Edit transaction"
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingId(t.id)}
                          title="Delete transaction"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {transactions.length} of {pagination.totalCount} records (Page {page} of {pagination.totalPages})
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal (Add / Edit) */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveTransaction}
        initialData={editingTransaction}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This will permanently adjust your monthly expenses and available balance."
        confirmLabel="Yes, Delete"
        isDestructive={true}
      />
    </div>
  );
};
