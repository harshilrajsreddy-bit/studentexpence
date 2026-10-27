import { Router, Response } from 'express';
import { z } from 'zod';
import { db, SavingsGoal } from '../db/database.ts';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  target_amount: z.number().positive('Target amount must be positive'),
  saved_amount: z.number().min(0).default(0),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Deadline must be YYYY-MM-DD').optional().nullable(),
  status: z.enum(['in_progress', 'completed', 'paused']).default('in_progress')
});

const contributeSchema = z.object({
  amount: z.number().positive('Contribution amount must be positive'),
  mode: z.enum(['add', 'withdraw']).default('add')
});

// List Goals
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const goals = db.getSavingsGoals(userId);
    const now = new Date();

    const enhancedGoals = goals.map(g => {
      const remaining = Math.max(0, g.target_amount - g.saved_amount);
      const percentage = g.target_amount > 0 ? Math.min(100, Math.round((g.saved_amount / g.target_amount) * 100)) : 0;

      let suggestedMonthlyContribution: number | null = null;
      let daysRemaining: number | null = null;

      if (g.deadline) {
        const deadlineDate = new Date(g.deadline + 'T00:00:00');
        const diffMs = deadlineDate.getTime() - now.setHours(0, 0, 0, 0);
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (daysRemaining > 0 && remaining > 0) {
          const monthsRemaining = Math.max(1, daysRemaining / 30);
          suggestedMonthlyContribution = Math.round(remaining / monthsRemaining);
        }
      }

      return {
        ...g,
        remaining_amount: remaining,
        percentage,
        days_remaining: daysRemaining,
        suggested_monthly_contribution: suggestedMonthlyContribution
      };
    });

    const activeGoals = enhancedGoals.filter(g => g.status !== 'completed');
    const completedGoals = enhancedGoals.filter(g => g.status === 'completed');

    const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0);
    const totalSaved = goals.reduce((s, g) => s + Number(g.saved_amount), 0);

    res.json({
      success: true,
      stats: {
        totalTarget,
        totalSaved,
        overallPercentage: totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0,
        activeCount: activeGoals.length,
        completedCount: completedGoals.length
      },
      activeGoals,
      completedGoals
    });
  } catch (err) {
    console.error('Error fetching savings goals:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve savings goals' });
  }
});

// Create Goal
router.post('/', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsed = goalSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Validation error'
      });
      return;
    }

    const { title, target_amount, saved_amount, deadline, status } = parsed.data;
    const nowIso = new Date().toISOString();

    const newGoal: SavingsGoal = {
      id: `sg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      title: title.trim(),
      target_amount: Math.round(target_amount * 100) / 100,
      saved_amount: Math.round((saved_amount || 0) * 100) / 100,
      deadline: deadline || undefined,
      status: (saved_amount || 0) >= target_amount ? 'completed' : status,
      created_at: nowIso,
      updated_at: nowIso
    };

    const saved = db.createSavingsGoal(newGoal);

    res.status(201).json({
      success: true,
      message: 'Savings goal created successfully',
      goal: saved
    });
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ success: false, error: 'Failed to create savings goal' });
  }
});

// Update Goal
router.put('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = goalSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Validation error'
      });
      return;
    }

    const updates: Partial<SavingsGoal> = {};
    if (parsed.data.title) updates.title = parsed.data.title.trim();
    if (parsed.data.target_amount !== undefined) updates.target_amount = Math.round(parsed.data.target_amount * 100) / 100;
    if (parsed.data.saved_amount !== undefined) updates.saved_amount = Math.round(parsed.data.saved_amount * 100) / 100;
    if (parsed.data.deadline !== undefined) updates.deadline = parsed.data.deadline || undefined;
    if (parsed.data.status) updates.status = parsed.data.status;

    const updated = db.updateSavingsGoal(userId, id, updates);

    if (!updated) {
      res.status(404).json({ success: false, error: 'Goal not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Savings goal updated',
      goal: updated
    });
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ success: false, error: 'Failed to update goal' });
  }
});

// Contribute (Deposit or Withdraw from Goal)
router.post('/:id/contribute', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const parsed = contributeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Validation error'
      });
      return;
    }

    const goal = db.getSavingsGoals(userId).find(g => g.id === id);
    if (!goal) {
      res.status(404).json({ success: false, error: 'Goal not found' });
      return;
    }

    const { amount, mode } = parsed.data;
    let newSaved = goal.saved_amount;

    if (mode === 'add') {
      newSaved += amount;
    } else {
      newSaved = Math.max(0, newSaved - amount);
    }

    const updated = db.updateSavingsGoal(userId, id, {
      saved_amount: Math.round(newSaved * 100) / 100,
      status: newSaved >= goal.target_amount ? 'completed' : 'in_progress'
    });

    res.json({
      success: true,
      message: `${mode === 'add' ? 'Added' : 'Withdrew'} funds successfully`,
      goal: updated
    });
  } catch (err) {
    console.error('Contribute error:', err);
    res.status(500).json({ success: false, error: 'Failed to record contribution' });
  }
});

// Delete Goal
router.delete('/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = db.deleteSavingsGoal(userId, id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Goal not found or already deleted' });
      return;
    }

    res.json({ success: true, message: 'Savings goal deleted' });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete goal' });
  }
});

export default router;
