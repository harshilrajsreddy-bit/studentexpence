import { db, Transaction, Budget, Profile } from '../db/database.ts';

export interface DashboardSummary {
  currency: string;
  monthlyPocketMoney: number;
  totalIncomeThisMonth: number;
  totalExpensesThisMonth: number;
  availableBalance: number;
  amountSavedThisMonth: number;
  monthlyBudget: number;
  monthlyBudgetUsagePercentage: number;
  dailySpending: { date: string; amount: number; dayLabel: string }[];
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  budgetProgress: {
    category: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentage: number;
    status: 'safe' | 'warning' | 'danger';
  }[];
  recentTransactions: Transaction[];
  topSpendingCategories: { category: string; amount: number; percentage: number }[];
  alerts: {
    id: string;
    type: 'info' | 'warning' | 'danger';
    title: string;
    message: string;
  }[];
  savingsGoalSummary: {
    totalTarget: number;
    totalSaved: number;
    percentage: number;
    activeGoalsCount: number;
  };
}

export interface SurvivalPrediction {
  currency: string;
  currentBalance: number;
  historicalPeriodDays: number;
  eligibleExpensesCount: number;
  totalEligibleExpenses: number;
  averageDailySpending: number;
  estimatedDaysRemaining: number | null;
  daysUntilNextPocketMoney: number;
  expectedNextDate: string;
  projectedNextDateBalance: number;
  isSustainable: boolean;
  sustainabilityStatus: 'healthy' | 'caution' | 'critical' | 'insufficient_data';
  suggestedMaxDailyLimit: number;
  discretionarySpendingShare: number;
  recommendations: string[];
}

export interface SpendingInsights {
  currency: string;
  highestCategory: { category: string; amount: number; percentage: number } | null;
  averageDailySpending: number;
  mostExpensiveTransaction: Transaction | null;
  weekdayVsWeekend: {
    weekdayTotal: number;
    weekdayDailyAvg: number;
    weekendTotal: number;
    weekendDailyAvg: number;
    weekendHigher: boolean;
    percentageDifference: number;
  };
  monthlyComparison: {
    currentMonthTotal: number;
    previousMonthTotal: number;
    percentageChange: number;
    trend: 'increased' | 'decreased' | 'equal';
    insightText: string;
  };
  categoryWarnings: {
    category: string;
    spent: number;
    budgeted: number;
    percentage: number;
    message: string;
  }[];
  personalizedTips: {
    title: string;
    advice: string;
    impact: 'high' | 'medium' | 'low';
  }[];
}

export class CalculationService {
  // Format YYYY-MM
  private static getMonthKey(date: Date = new Date()): string {
    return date.toISOString().slice(0, 7);
  }

  private static getPreviousMonthKey(date: Date = new Date()): string {
    const d = new Date(date);
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 7);
  }

  public static getDashboardSummary(userId: string, filterMonth?: string): DashboardSummary {
    const profile: Profile = db.getProfile(userId) || {
      id: userId,
      full_name: 'Student',
      currency: '₹',
      monthly_pocket_money: 8000,
      savings_target: 2000,
      expected_pocket_day: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const currency = profile.currency || '₹';
    const now = new Date();
    const activeMonth = filterMonth || this.getMonthKey(now);

    const allTransactions = db.getTransactions(userId);

    // Lifetime balance calculation
    const totalLifetimeIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalLifetimeExpenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const availableBalance = totalLifetimeIncome - totalLifetimeExpenses;

    // Filter transactions for the requested month
    const monthTransactions = allTransactions.filter(t => t.transaction_date.startsWith(activeMonth));

    const totalIncomeThisMonth = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpensesThisMonth = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Amount saved this month = (Income this month - Expenses this month), or 0 if negative
    const netSavings = Math.max(0, totalIncomeThisMonth - totalExpensesThisMonth);

    // Monthly budgets
    const userBudgets = db.getBudgets(userId, activeMonth);
    const overallBudgetRecord = userBudgets.find(b => b.category.toLowerCase() === 'overall');
    const monthlyBudget = overallBudgetRecord ? Number(overallBudgetRecord.amount) : Number(profile.monthly_pocket_money);

    const monthlyBudgetUsagePercentage = monthlyBudget > 0
      ? Math.min(999, Math.round((totalExpensesThisMonth / monthlyBudget) * 100))
      : 0;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    const expenseTxInMonth = monthTransactions.filter(t => t.type === 'expense');

    for (const tx of expenseTxInMonth) {
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + Number(tx.amount);
    }

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpensesThisMonth > 0 ? Math.round((amount / totalExpensesThisMonth) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    const topSpendingCategories = categoryBreakdown.slice(0, 5);

    // Daily spending for the month
    // Build days map
    const [yearStr, monthStr] = activeMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const dailySpendingMap: Record<string, number> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dayFormatted = `${activeMonth}-${String(day).padStart(2, '0')}`;
      dailySpendingMap[dayFormatted] = 0;
    }

    for (const tx of expenseTxInMonth) {
      if (dailySpendingMap[tx.transaction_date] !== undefined) {
        dailySpendingMap[tx.transaction_date] += Number(tx.amount);
      }
    }

    const dailySpending = Object.entries(dailySpendingMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, amount]) => {
        const d = new Date(date + 'T00:00:00');
        const dayLabel = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
        return { date, amount, dayLabel };
      });

    // Budget progress per category
    const budgetProgress = userBudgets
      .filter(b => b.category.toLowerCase() !== 'overall')
      .map(b => {
        const spent = categoryTotals[b.category] || 0;
        const budgeted = Number(b.amount);
        const remaining = Math.max(0, budgeted - spent);
        const percentage = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;
        let status: 'safe' | 'warning' | 'danger' = 'safe';
        if (percentage >= 100) status = 'danger';
        else if (percentage >= 80) status = 'warning';

        return {
          category: b.category,
          budgeted,
          spent,
          remaining,
          percentage,
          status
        };
      })
      .sort((a, b) => b.percentage - a.percentage);

    // Alerts generation
    const alerts: DashboardSummary['alerts'] = [];

    if (monthlyBudgetUsagePercentage >= 100) {
      alerts.push({
        id: 'alt-budget-100',
        type: 'danger',
        title: 'Monthly Budget Exceeded',
        message: `You have spent ${currency}${totalExpensesThisMonth.toLocaleString()} of your ${currency}${monthlyBudget.toLocaleString()} overall budget (${monthlyBudgetUsagePercentage}%).`
      });
    } else if (monthlyBudgetUsagePercentage >= 90) {
      alerts.push({
        id: 'alt-budget-90',
        type: 'danger',
        title: 'Critical Budget Alert (90%)',
        message: `You've used ${monthlyBudgetUsagePercentage}% of your total budget with time remaining this month.`
      });
    } else if (monthlyBudgetUsagePercentage >= 75) {
      alerts.push({
        id: 'alt-budget-75',
        type: 'warning',
        title: 'Budget Alert (75%)',
        message: `You've reached ${monthlyBudgetUsagePercentage}% of your monthly spending limit.`
      });
    }

    // Category-specific overspending alerts
    for (const bp of budgetProgress) {
      if (bp.percentage >= 100) {
        alerts.push({
          id: `alt-cat-${bp.category}`,
          type: 'danger',
          title: `${bp.category} Limit Exceeded`,
          message: `Spent ${currency}${bp.spent.toLocaleString()} against ${currency}${bp.budgeted.toLocaleString()} limit.`
        });
      }
    }

    // Savings Goals summary
    const savingsGoals = db.getSavingsGoals(userId);
    const activeGoals = savingsGoals.filter(g => g.status === 'in_progress');
    const totalTarget = savingsGoals.reduce((sum, g) => sum + Number(g.target_amount), 0);
    const totalSaved = savingsGoals.reduce((sum, g) => sum + Number(g.saved_amount), 0);
    const goalPercentage = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    // Recent 5 transactions
    const recentTransactions = [...allTransactions]
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())
      .slice(0, 5);

    return {
      currency,
      monthlyPocketMoney: Number(profile.monthly_pocket_money) || 8000,
      totalIncomeThisMonth,
      totalExpensesThisMonth,
      availableBalance,
      amountSavedThisMonth: netSavings,
      monthlyBudget,
      monthlyBudgetUsagePercentage,
      dailySpending,
      categoryBreakdown,
      budgetProgress,
      recentTransactions,
      topSpendingCategories,
      alerts,
      savingsGoalSummary: {
        totalTarget,
        totalSaved,
        percentage: goalPercentage,
        activeGoalsCount: activeGoals.length
      }
    };
  }

  /**
   * Signature Feature: Pocket Money Survival Predictor
   */
  public static calculateSurvivalPredictor(
    userId: string,
    params: {
      historicalDays?: number;
      customExpectedDate?: string;
    }
  ): SurvivalPrediction {
    const historicalPeriodDays = params.historicalDays || 30;
    const profile = db.getProfile(userId);
    const currency = profile?.currency || '₹';
    const expectedDay = profile?.expected_pocket_day || 1;

    const allTransactions = db.getTransactions(userId);

    // Calculate current available balance (lifetime income - lifetime expenses)
    const totalIncome = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentBalance = totalIncome - totalExpense;

    // Historical eligible expenses
    // Exclude future-dated transactions
    // Exclude income transactions
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - historicalPeriodDays);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const eligibleExpenses = allTransactions.filter(t =>
      t.type === 'expense' &&
      t.transaction_date >= cutoffDateStr &&
      t.transaction_date <= todayStr
    );

    const totalEligibleExpenses = eligibleExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const eligibleExpensesCount = eligibleExpenses.length;

    // Calculate average daily spending
    const averageDailySpending = historicalPeriodDays > 0
      ? Math.round((totalEligibleExpenses / historicalPeriodDays) * 100) / 100
      : 0;

    // Determine target next pocket money date
    let expectedNextDateStr = params.customExpectedDate || '';
    let daysUntilNext = 0;

    if (expectedNextDateStr) {
      const targetDate = new Date(expectedNextDateStr + 'T00:00:00');
      const diffMs = targetDate.getTime() - now.setHours(0, 0, 0, 0);
      daysUntilNext = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      // Compute next occurrence of expectedDay (e.g. 1st of next month)
      const currentYear = now.getFullYear();
      const currentMonthIndex = now.getMonth();
      const currentDay = now.getDate();

      let targetYear = currentYear;
      let targetMonthIndex = currentMonthIndex;

      if (currentDay >= expectedDay) {
        // next month
        targetMonthIndex += 1;
        if (targetMonthIndex > 11) {
          targetMonthIndex = 0;
          targetYear += 1;
        }
      }

      const nextTargetDate = new Date(targetYear, targetMonthIndex, expectedDay);
      expectedNextDateStr = nextTargetDate.toISOString().split('T')[0];
      const diffMs = nextTargetDate.getTime() - new Date(todayStr + 'T00:00:00').getTime();
      daysUntilNext = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    // Safeguards
    if (eligibleExpensesCount === 0 || totalEligibleExpenses === 0) {
      const suggestedDaily = daysUntilNext > 0 ? Math.max(0, Math.round(currentBalance / daysUntilNext)) : 0;
      return {
        currency,
        currentBalance,
        historicalPeriodDays,
        eligibleExpensesCount: 0,
        totalEligibleExpenses: 0,
        averageDailySpending: 0,
        estimatedDaysRemaining: null,
        daysUntilNextPocketMoney: daysUntilNext,
        expectedNextDate: expectedNextDateStr,
        projectedNextDateBalance: currentBalance,
        isSustainable: currentBalance > 0,
        sustainabilityStatus: 'insufficient_data',
        suggestedMaxDailyLimit: suggestedDaily,
        discretionarySpendingShare: 0,
        recommendations: [
          'Log your daily snacks, meals, and transport expenses to activate automated survival burn-rate analysis.',
          `Based on your current balance of ${currency}${currentBalance.toLocaleString()}, you can spend up to ${currency}${suggestedDaily}/day until your next pocket money date.`
        ]
      };
    }

    // Estimated days remaining
    let estimatedDaysRemaining: number | null = null;
    if (averageDailySpending > 0 && currentBalance > 0) {
      estimatedDaysRemaining = Math.max(0, Math.floor(currentBalance / averageDailySpending));
    } else if (currentBalance <= 0) {
      estimatedDaysRemaining = 0;
    }

    // Projected balance on next pocket-money date
    const projectedSpendingUntilNext = averageDailySpending * daysUntilNext;
    const projectedNextDateBalance = Math.round((currentBalance - projectedSpendingUntilNext) * 100) / 100;

    const isSustainable = projectedNextDateBalance >= 0;

    let sustainabilityStatus: 'healthy' | 'caution' | 'critical' | 'insufficient_data' = 'healthy';
    if (projectedNextDateBalance < 0) {
      sustainabilityStatus = 'critical';
    } else if (projectedNextDateBalance < currentBalance * 0.15 || (estimatedDaysRemaining !== null && estimatedDaysRemaining <= daysUntilNext + 2)) {
      sustainabilityStatus = 'caution';
    }

    // Suggested maximum daily spending limit
    const suggestedMaxDailyLimit = daysUntilNext > 0 && currentBalance > 0
      ? Math.max(0, Math.round((currentBalance / daysUntilNext) * 100) / 100)
      : 0;

    // Discretionary spending breakdown (Food & Snacks, Entertainment, Shopping)
    const discretionaryCategories = ['Food and snacks', 'Entertainment', 'Shopping'];
    const discretionaryTotal = eligibleExpenses
      .filter(t => discretionaryCategories.includes(t.category))
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const discretionarySpendingShare = totalEligibleExpenses > 0
      ? Math.round((discretionaryTotal / totalEligibleExpenses) * 100)
      : 0;

    // Actionable recommendations based on real calculated figures
    const recommendations: string[] = [];

    if (sustainabilityStatus === 'critical') {
      const shortfall = Math.abs(projectedNextDateBalance);
      recommendations.push(
        `🚨 Deficit Warning: At your current burn rate (${currency}${averageDailySpending.toFixed(0)}/day), your funds will deplete ~${Math.max(0, daysUntilNext - (estimatedDaysRemaining || 0))} days before your next pocket money arrives.`
      );
      recommendations.push(
        `Cap spending strictly at ${currency}${suggestedMaxDailyLimit.toFixed(0)}/day (a reduction of ${currency}${Math.max(0, averageDailySpending - suggestedMaxDailyLimit).toFixed(0)}/day) to prevent running out of money.`
      );
      if (discretionarySpendingShare > 40) {
        recommendations.push(
          `Discretionary spending (snacks, eating out, shopping) comprises ${discretionarySpendingShare}% of your outlays. Postponing non-essential cafe trips can save ~${currency}${Math.round(discretionaryTotal * 0.35)}.`
        );
      }
    } else if (sustainabilityStatus === 'caution') {
      recommendations.push(
        `⚠️ Tight Runway: You are projected to finish with just ${currency}${projectedNextDateBalance.toFixed(0)} buffer.`
      );
      recommendations.push(
        `Keep daily expenses under ${currency}${suggestedMaxDailyLimit.toFixed(0)} to maintain a comfortable emergency buffer until ${expectedNextDateStr}.`
      );
    } else {
      recommendations.push(
        `✅ Sustainable Cadence: Your current average spend of ${currency}${averageDailySpending.toFixed(0)}/day will leave an estimated surplus of ${currency}${projectedNextDateBalance.toFixed(0)} on ${expectedNextDateStr}.`
      );
      recommendations.push(
        `Opportunity: You can safely allocate ${currency}${Math.round(projectedNextDateBalance * 0.5)} towards your active Savings Goals without risking month-end liquidity.`
      );
    }

    return {
      currency,
      currentBalance,
      historicalPeriodDays,
      eligibleExpensesCount,
      totalEligibleExpenses,
      averageDailySpending,
      estimatedDaysRemaining,
      daysUntilNextPocketMoney: daysUntilNext,
      expectedNextDate: expectedNextDateStr,
      projectedNextDateBalance,
      isSustainable,
      sustainabilityStatus,
      suggestedMaxDailyLimit,
      discretionarySpendingShare,
      recommendations
    };
  }

  /**
   * Spending Insights and Analytics
   */
  public static getSpendingInsights(userId: string): SpendingInsights {
    const profile = db.getProfile(userId);
    const currency = profile?.currency || '₹';
    const allTransactions = db.getTransactions(userId);
    const now = new Date();

    const currentMonthKey = this.getMonthKey(now);
    const prevMonthKey = this.getPreviousMonthKey(now);

    const currentMonthExpenses = allTransactions.filter(
      t => t.type === 'expense' && t.transaction_date.startsWith(currentMonthKey)
    );
    const prevMonthExpenses = allTransactions.filter(
      t => t.type === 'expense' && t.transaction_date.startsWith(prevMonthKey)
    );

    const currentMonthTotal = currentMonthExpenses.reduce((s, t) => s + Number(t.amount), 0);
    const prevMonthTotal = prevMonthExpenses.reduce((s, t) => s + Number(t.amount), 0);

    // Percentage change
    let percentageChange = 0;
    let trend: 'increased' | 'decreased' | 'equal' = 'equal';
    let insightText = 'Insufficient previous month records for comparison.';

    if (prevMonthTotal > 0) {
      percentageChange = Math.round(((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100);
      if (percentageChange > 0) {
        trend = 'increased';
        insightText = `Your overall spending is ${percentageChange}% higher than last month.`;
      } else if (percentageChange < 0) {
        trend = 'decreased';
        insightText = `Great job! Your spending is ${Math.abs(percentageChange)}% lower than last month.`;
      } else {
        trend = 'equal';
        insightText = 'Your spending is exactly matching last month’s pace.';
      }
    } else if (currentMonthTotal > 0) {
      insightText = `Recorded ${currency}${currentMonthTotal.toLocaleString()} in expenses this month.`;
    }

    // Highest spending category
    const catMap: Record<string, number> = {};
    for (const t of currentMonthExpenses) {
      catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount);
    }

    let highestCategory: { category: string; amount: number; percentage: number } | null = null;
    const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    if (catEntries.length > 0) {
      const [cat, amt] = catEntries[0];
      highestCategory = {
        category: cat,
        amount: amt,
        percentage: currentMonthTotal > 0 ? Math.round((amt / currentMonthTotal) * 100) : 0
      };
    }

    // Most expensive transaction
    let mostExpensiveTransaction: Transaction | null = null;
    if (currentMonthExpenses.length > 0) {
      mostExpensiveTransaction = [...currentMonthExpenses].sort((a, b) => Number(b.amount) - Number(a.amount))[0];
    }

    // Average daily spending this month
    const dayOfMonth = Math.max(1, now.getDate());
    const averageDailySpending = Math.round((currentMonthTotal / dayOfMonth) * 100) / 100;

    // Weekday vs Weekend spending
    let weekdayTotal = 0;
    let weekendTotal = 0;
    let weekdayCount = 0;
    let weekendCount = 0;

    for (const t of currentMonthExpenses) {
      const d = new Date(t.transaction_date + 'T00:00:00');
      const dayOfWeek = d.getDay(); // 0 is Sun, 6 is Sat
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendTotal += Number(t.amount);
        weekendCount++;
      } else {
        weekdayTotal += Number(t.amount);
        weekdayCount++;
      }
    }

    const weekdayDailyAvg = weekdayCount > 0 ? Math.round(weekdayTotal / weekdayCount) : 0;
    const weekendDailyAvg = weekendCount > 0 ? Math.round(weekendTotal / weekendCount) : 0;
    const weekendHigher = weekendDailyAvg > weekdayDailyAvg;
    const percentageDifference = weekdayDailyAvg > 0
      ? Math.round((Math.abs(weekendDailyAvg - weekdayDailyAvg) / weekdayDailyAvg) * 100)
      : 0;

    // Category warnings against budgets
    const userBudgets = db.getBudgets(userId, currentMonthKey);
    const categoryWarnings: SpendingInsights['categoryWarnings'] = [];

    for (const b of userBudgets) {
      if (b.category.toLowerCase() === 'overall') continue;
      const spent = catMap[b.category] || 0;
      const budgeted = Number(b.amount);
      const pct = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;

      if (pct >= 85) {
        categoryWarnings.push({
          category: b.category,
          spent,
          budgeted,
          percentage: pct,
          message: pct >= 100
            ? `Exceeded budget by ${currency}${(spent - budgeted).toLocaleString()}`
            : `Used ${pct}% of budget (${currency}${spent.toLocaleString()} / ${currency}${budgeted.toLocaleString()})`
        });
      }
    }

    // Personalized Tips based on actual figures
    const personalizedTips: SpendingInsights['personalizedTips'] = [];

    if (highestCategory && highestCategory.percentage > 40) {
      personalizedTips.push({
        title: `High Concentration in ${highestCategory.category}`,
        advice: `${highestCategory.category} accounts for ${highestCategory.percentage}% of your entire monthly spending. Setting a weekly cap of ${currency}${Math.round((highestCategory.amount * 0.8) / 4)} can save you pocket money.`,
        impact: 'high'
      });
    }

    if (weekendHigher && percentageDifference > 25) {
      personalizedTips.push({
        title: 'Weekend Splurge Effect',
        advice: `Your average weekend day expense is ${percentageDifference}% higher than your weekday rate. Try pre-booking movie tickets or setting a fixed ₹300 weekend leisure limit.`,
        impact: 'medium'
      });
    }

    if (currentMonthTotal < (profile?.monthly_pocket_money || 8000) * 0.6 && dayOfMonth > 20) {
      personalizedTips.push({
        title: 'Strong Surplus Opportunity',
        advice: `You are past day ${dayOfMonth} and have kept expenses low. Allocate ₹1,000 to your savings goal to build an emergency college fund.`,
        impact: 'low'
      });
    }

    if (personalizedTips.length === 0) {
      personalizedTips.push({
        title: 'Consistent Financial Pacing',
        advice: 'Your spending cadence is steady across categories. Keep reviewing daily food expenses to stay on track.',
        impact: 'low'
      });
    }

    return {
      currency,
      highestCategory,
      averageDailySpending,
      mostExpensiveTransaction,
      weekdayVsWeekend: {
        weekdayTotal,
        weekdayDailyAvg,
        weekendTotal,
        weekendDailyAvg,
        weekendHigher,
        percentageDifference
      },
      monthlyComparison: {
        currentMonthTotal,
        previousMonthTotal: prevMonthTotal,
        percentageChange,
        trend,
        insightText
      },
      categoryWarnings,
      personalizedTips
    };
  }
}
