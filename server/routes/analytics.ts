import { Router, Response } from 'express';
import { CalculationService } from '../services/calculationService.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';
import { db } from '../db/database.ts';

const router = Router();

// Dashboard Summary API
router.get('/dashboard', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { month } = req.query as { month?: string };
    const summary = CalculationService.getDashboardSummary(userId, month);

    res.json({
      success: true,
      summary
    });
  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    res.status(500).json({ success: false, error: 'Failed to calculate dashboard summary' });
  }
});

// Signature Feature: Pocket Money Survival Predictor
router.get('/survival', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const historicalDays = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    const customExpectedDate = (req.query.targetDate as string) || undefined;

    const prediction = CalculationService.calculateSurvivalPredictor(userId, {
      historicalDays,
      customExpectedDate
    });

    res.json({
      success: true,
      prediction
    });
  } catch (err) {
    console.error('Survival predictor error:', err);
    res.status(500).json({ success: false, error: 'Failed to compute survival prediction' });
  }
});

// Spending Insights
router.get('/insights', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const insights = CalculationService.getSpendingInsights(userId);

    res.json({
      success: true,
      insights
    });
  } catch (err) {
    console.error('Insights error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate spending insights' });
  }
});

// Comprehensive Report
router.get('/report', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const month = (req.query.month as string) || now.toISOString().slice(0, 7);

    const profile = db.getProfile(userId);
    const currency = profile?.currency || '₹';
    const allTransactions = db.getTransactions(userId);
    const monthTransactions = allTransactions.filter(t => t.transaction_date.startsWith(month));

    const totalIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0);

    const totalExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);

    const categoryMap: Record<string, { count: number; total: number }> = {};
    for (const t of monthTransactions.filter(t => t.type === 'expense')) {
      if (!categoryMap[t.category]) {
        categoryMap[t.category] = { count: 0, total: 0 };
      }
      categoryMap[t.category].count += 1;
      categoryMap[t.category].total += Number(t.amount);
    }

    const categorySummary = Object.entries(categoryMap).map(([category, data]) => ({
      category,
      count: data.count,
      total: data.total,
      percentage: totalExpense > 0 ? Math.round((data.total / totalExpense) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    res.json({
      success: true,
      report: {
        month,
        currency,
        userName: profile?.full_name || 'Student',
        totalTransactions: monthTransactions.length,
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        categorySummary,
        transactions: monthTransactions.sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))
      }
    });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
});

export default router;
