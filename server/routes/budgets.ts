import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

const budgetSchema = z.object({
  category: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Budget amount must be positive'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month format must be YYYY-MM')
});

// Get budgets for a month with real spend calculations
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const month = (req.query.month as string) || currentMonth;

    const budgets = db.getBudgets(userId, month);
    const transactions = db.getTransactions(userId).filter(
      t => t.type === 'expense' && t.transaction_date.startsWith(month)
    );

    // Compute actual spend per category
    const categorySpend: Record<string, number> = {};
    let totalExpenseInMonth = 0;

    for (const t of transactions) {
      const amt = Number(t.amount);
      totalExpenseInMonth += amt;
      categorySpend[t.category] = (categorySpend[t.category] || 0) + amt;
    }

    const overallBudgetRecord = budgets.find(b => b.category.toLowerCase() === 'overall');
    const profile = db.getProfile(userId);
    const overallBudget = overallBudgetRecord
      ? Number(overallBudgetRecord.amount)
      : (Number(profile?.monthly_pocket_money) || 8000);

    const detailedBudgets = budgets.map(b => {
      const isOverall = b.category.toLowerCase() === 'overall';
      const spent = isOverall ? totalExpenseInMonth : (categorySpend[b.category] || 0);
      const budgeted = Number(b.amount);
      const remaining = Math.max(0, budgeted - spent);
      const percentage = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;

      let alertLevel: 'normal' | 'caution' | 'warning' | 'danger' = 'normal';
      if (percentage >= 100) alertLevel = 'danger';
      else if (percentage >= 90) alertLevel = 'warning';
      else if (percentage >= 75) alertLevel = 'caution';

      return {
        id: b.id,
        category: b.category,
        amount: budgeted,
        month: b.month,
        spent,
        remaining,
        percentage,
        alertLevel
      };
    });

    // If overall budget was not explicitly saved in budgets table, provide synthesized object
    const hasOverallInList = detailedBudgets.some(b => b.category.toLowerCase() === 'overall');
    if (!hasOverallInList) {
      const spent = totalExpenseInMonth;
      const budgeted = overallBudget;
      const percentage = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;
      let alertLevel: 'normal' | 'caution' | 'warning' | 'danger' = 'normal';
      if (percentage >= 100) alertLevel = 'danger';
      else if (percentage >= 90) alertLevel = 'warning';
      else if (percentage >= 75) alertLevel = 'caution';

      detailedBudgets.unshift({
        id: 'synthetic-overall',
        category: 'Overall',
        amount: budgeted,
        month,
        spent,
        remaining: Math.max(0, budgeted - spent),
        percentage,
        alertLevel
      });
    }

    res.json({
      success: true,
      month,
      totalBudgeted: detailedBudgets
        .filter(b => b.category.toLowerCase() !== 'overall')
        .reduce((s, b) => s + b.amount, 0),
      overallBudget,
      totalSpent: totalExpenseInMonth,
      budgets: detailedBudgets
    });
  } catch (err) {
    console.error('Error fetching budgets:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve budgets' });
  }
});

// Upsert budget
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsed = budgetSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Validation failed'
      });
      return;
    }

    const { category, amount, month } = parsed.data;
    const saved = db.upsertBudget(userId, category, Math.round(amount * 100) / 100, month);

    res.status(200).json({
      success: true,
      message: `Budget for ${category} updated successfully`,
      budget: saved
    });
  } catch (err) {
    console.error('Error saving budget:', err);
    res.status(500).json({ success: false, error: 'Failed to update budget' });
  }
});

// Delete budget
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = db.deleteBudget(userId, id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Budget item not found' });
      return;
    }

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (err) {
    console.error('Error deleting budget:', err);
    res.status(500).json({ success: false, error: 'Failed to delete budget' });
  }
});

export default router;
