import { Router, Response } from 'express';
import { z } from 'zod';
import { db, Transaction } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be a positive number'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(1, 'Description is required').max(200),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted YYYY-MM-DD'),
  payment_method: z.string().default('UPI'),
  notes: z.string().optional().default('')
});

// List & Filter Transactions
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let transactions = db.getTransactions(userId);

    const {
      type,
      category,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      page = '1',
      limit = '20'
    } = req.query as Record<string, string>;

    // Filter by type
    if (type && type !== 'all') {
      transactions = transactions.filter(t => t.type.toLowerCase() === type.toLowerCase());
    }

    // Filter by category
    if (category && category !== 'all') {
      transactions = transactions.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }

    // Filter by date range
    if (startDate) {
      transactions = transactions.filter(t => t.transaction_date >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter(t => t.transaction_date <= endDate);
    }

    // Filter by search query (description or notes)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      transactions = transactions.filter(
        t => t.description.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    // Sorting
    transactions.sort((a, b) => {
      if (sortBy === 'amount') {
        const diff = Number(a.amount) - Number(b.amount);
        return sortOrder === 'asc' ? diff : -diff;
      }
      // default: date
      const diff = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime();
      return sortOrder === 'asc' ? diff : -diff;
    });

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const totalCount = transactions.length;
    const totalPages = Math.ceil(totalCount / limitNum) || 1;
    const startIndex = (pageNum - 1) * limitNum;
    const paginated = transactions.slice(startIndex, startIndex + limitNum);

    // Compute active totals for filtered results
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    res.json({
      success: true,
      transactions: paginated,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalCount,
        totalPages
      },
      filteredTotals: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense
      }
    });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve transactions' });
  }
});

// CSV Export
router.get('/export/csv', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    let transactions = db.getTransactions(userId);
    const { startDate, endDate, category, type } = req.query as Record<string, string>;

    if (type && type !== 'all') {
      transactions = transactions.filter(t => t.type.toLowerCase() === type.toLowerCase());
    }
    if (category && category !== 'all') {
      transactions = transactions.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }
    if (startDate) {
      transactions = transactions.filter(t => t.transaction_date >= startDate);
    }
    if (endDate) {
      transactions = transactions.filter(t => t.transaction_date <= endDate);
    }

    transactions.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date));

    // Build CSV content
    const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Notes'];
    const rows = transactions.map(t => [
      `"${t.id}"`,
      `"${t.transaction_date}"`,
      `"${t.type.toUpperCase()}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      `"${(t.payment_method || '').replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="student_spendsense_export_${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate CSV export' });
  }
});

// Add Transaction
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsed = transactionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Validation failed'
      });
      return;
    }

    const { type, amount, category, description, transaction_date, payment_method, notes } = parsed.data;

    const newTx: Transaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      type,
      amount: Math.round(amount * 100) / 100,
      category,
      description: description.trim(),
      transaction_date,
      payment_method: payment_method || 'UPI',
      notes: notes ? notes.trim() : '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const saved = db.createTransaction(newTx);

    res.status(201).json({
      success: true,
      message: `${type === 'income' ? 'Income' : 'Expense'} recorded successfully`,
      transaction: saved
    });
  } catch (err) {
    console.error('Add transaction error:', err);
    res.status(500).json({ success: false, error: 'Failed to save transaction' });
  }
});

// Update Transaction
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const existing = db.getTransactionById(userId, id);
    if (!existing) {
      res.status(404).json({ success: false, error: 'Transaction not found or unauthorized' });
      return;
    }

    const parsed = transactionSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Validation failed'
      });
      return;
    }

    const updates: Partial<Transaction> = {};
    if (parsed.data.type) updates.type = parsed.data.type;
    if (parsed.data.amount) updates.amount = Math.round(parsed.data.amount * 100) / 100;
    if (parsed.data.category) updates.category = parsed.data.category;
    if (parsed.data.description) updates.description = parsed.data.description.trim();
    if (parsed.data.transaction_date) updates.transaction_date = parsed.data.transaction_date;
    if (parsed.data.payment_method) updates.payment_method = parsed.data.payment_method;
    if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes.trim();

    const updated = db.updateTransaction(userId, id, updates);

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updated
    });
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ success: false, error: 'Failed to update transaction' });
  }
});

// Delete Transaction
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = db.deleteTransaction(userId, id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Transaction not found or already deleted' });
      return;
    }

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete transaction' });
  }
});

export default router;
