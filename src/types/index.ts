export interface User {
  id: string;
  email: string;
  full_name: string;
  currency: string;
  monthly_pocket_money: number;
  savings_target: number;
  expected_pocket_day: number;
  isDemo?: boolean;
  isTemp?: boolean;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  transaction_date: string; // YYYY-MM-DD
  payment_method: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  month: string;
  spent: number;
  remaining: number;
  percentage: number;
  alertLevel: 'normal' | 'caution' | 'warning' | 'danger';
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  deadline?: string;
  status: 'in_progress' | 'completed' | 'paused';
  remaining_amount: number;
  percentage: number;
  days_remaining?: number | null;
  suggested_monthly_contribution?: number | null;
  created_at: string;
  updated_at: string;
}

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

export const EXPENSE_CATEGORIES = [
  'Food and snacks',
  'Transportation',
  'College expenses',
  'Shopping',
  'Entertainment',
  'Mobile and internet',
  'Health',
  'Accommodation',
  'Other'
];

export const INCOME_CATEGORIES = [
  'Pocket money',
  'Scholarship',
  'Part-time job',
  'Freelance work',
  'Gifts',
  'Other'
];

export const PAYMENT_METHODS = [
  'UPI',
  'Cash',
  'Debit / Credit Card',
  'Bank Transfer',
  'College Wallet'
];
