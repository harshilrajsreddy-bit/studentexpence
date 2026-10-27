import {
  User,
  Transaction,
  Budget,
  SavingsGoal,
  DashboardSummary,
  SurvivalPrediction,
  SpendingInsights
} from '../types/index.ts';

const TOKEN_KEY = 'spendsense_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({ success: false, error: 'Malformed server response' }));

  if (!response.ok || !data.success) {
    const errorMsg = data.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string):Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setStoredToken(data.token);
    return data;
  },

  async register(payload: {
    fullName: string;
    email: string;
    password: string;
    currency?: string;
    monthlyPocketMoney?: number;
    savingsTarget?: number;
    expectedPocketDay?: number;
  }): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setStoredToken(data.token);
    return data;
  },

  async loginDemo(): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/api/auth/demo-login', {
      method: 'POST'
    });
    setStoredToken(data.token);
    return data;
  },

  async startTempSession(): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/api/auth/temp-session', {
      method: 'POST'
    });
    setStoredToken(data.token);
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const data = await request<{ user: User }>('/api/auth/me');
    return data.user;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const data = await request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.user;
  },

  logout() {
    setStoredToken(null);
  },

  // Transactions
  async getTransactions(params: {
    type?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    sortBy?: 'date' | 'amount';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    transactions: Transaction[];
    pagination: { page: number; limit: number; totalCount: number; totalPages: number };
    filteredTotals: { totalIncome: number; totalExpense: number; netBalance: number };
  }> {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.category) query.set('category', params.category);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.search) query.set('search', params.search);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return request(`/api/transactions${qs ? `?${qs}` : ''}`);
  },

  async createTransaction(payload: {
    type: 'income' | 'expense';
    amount: number;
    category: string;
    description: string;
    transaction_date: string;
    payment_method?: string;
    notes?: string;
  }): Promise<Transaction> {
    const data = await request<{ transaction: Transaction }>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return data.transaction;
  },

  async updateTransaction(id: string, payload: Partial<Transaction>): Promise<Transaction> {
    const data = await request<{ transaction: Transaction }>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    return data.transaction;
  },

  async deleteTransaction(id: string): Promise<void> {
    await request(`/api/transactions/${id}`, { method: 'DELETE' });
  },

  getExportCsvUrl(filters: { startDate?: string; endDate?: string; category?: string; type?: string } = {}): string {
    const token = getStoredToken();
    const query = new URLSearchParams();
    if (filters.startDate) query.set('startDate', filters.startDate);
    if (filters.endDate) query.set('endDate', filters.endDate);
    if (filters.category) query.set('category', filters.category);
    if (filters.type) query.set('type', filters.type);
    if (token) query.set('token', token);

    return `/api/transactions/export/csv?${query.toString()}`;
  },

  async downloadCsv(filters: { startDate?: string; endDate?: string; category?: string; type?: string } = {}) {
    const token = getStoredToken();
    const query = new URLSearchParams();
    if (filters.startDate) query.set('startDate', filters.startDate);
    if (filters.endDate) query.set('endDate', filters.endDate);
    if (filters.category) query.set('category', filters.category);
    if (filters.type) query.set('type', filters.type);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api/transactions/export/csv?${query.toString()}`, { headers });
    if (!response.ok) throw new Error('Failed to download CSV');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_spendsense_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // Budgets
  async getBudgets(month?: string): Promise<{
    month: string;
    totalBudgeted: number;
    overallBudget: number;
    totalSpent: number;
    budgets: Budget[];
  }> {
    const qs = month ? `?month=${month}` : '';
    return request(`/api/budgets${qs}`);
  },

  async upsertBudget(category: string, amount: number, month: string): Promise<Budget> {
    const data = await request<{ budget: Budget }>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ category, amount, month })
    });
    return data.budget;
  },

  async deleteBudget(id: string): Promise<void> {
    await request(`/api/budgets/${id}`, { method: 'DELETE' });
  },

  // Savings Goals
  async getSavingsGoals(): Promise<{
    stats: {
      totalTarget: number;
      totalSaved: number;
      overallPercentage: number;
      activeCount: number;
      completedCount: number;
    };
    activeGoals: SavingsGoal[];
    completedGoals: SavingsGoal[];
  }> {
    return request('/api/savings-goals');
  },

  async createSavingsGoal(payload: {
    title: string;
    target_amount: number;
    saved_amount?: number;
    deadline?: string;
  }): Promise<SavingsGoal> {
    const data = await request<{ goal: SavingsGoal }>('/api/savings-goals', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return data.goal;
  },

  async updateSavingsGoal(id: string, updates: Partial<SavingsGoal>): Promise<SavingsGoal> {
    const data = await request<{ goal: SavingsGoal }>(`/api/savings-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return data.goal;
  },

  async contributeSavingsGoal(id: string, amount: number, mode: 'add' | 'withdraw'): Promise<SavingsGoal> {
    const data = await request<{ goal: SavingsGoal }>(`/api/savings-goals/${id}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ amount, mode })
    });
    return data.goal;
  },

  async deleteSavingsGoal(id: string): Promise<void> {
    await request(`/api/savings-goals/${id}`, { method: 'DELETE' });
  },

  // Analytics & Predictions
  async getDashboardSummary(month?: string): Promise<DashboardSummary> {
    const qs = month ? `?month=${month}` : '';
    const data = await request<{ summary: DashboardSummary }>(`/api/analytics/dashboard${qs}`);
    return data.summary;
  },

  async getSurvivalPrediction(days: number = 30, targetDate?: string): Promise<SurvivalPrediction> {
    const query = new URLSearchParams();
    query.set('days', String(days));
    if (targetDate) query.set('targetDate', targetDate);
    const data = await request<{ prediction: SurvivalPrediction }>(`/api/analytics/survival?${query.toString()}`);
    return data.prediction;
  },

  async getSpendingInsights(): Promise<SpendingInsights> {
    const data = await request<{ insights: SpendingInsights }>('/api/analytics/insights');
    return data.insights;
  },

  async getReport(month?: string): Promise<{
    month: string;
    currency: string;
    userName: string;
    totalTransactions: number;
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    categorySummary: { category: string; count: number; total: number; percentage: number }[];
    transactions: Transaction[];
  }> {
    const qs = month ? `?month=${month}` : '';
    const data = await request<{ report: any }>(`/api/analytics/report${qs}`);
    return data.report;
  },

  // System
  async getSystemStatus(): Promise<any> {
    return request('/api/system/status');
  },

  async resetDemoData(): Promise<void> {
    await request('/api/system/reset-demo', { method: 'POST' });
  },

  async purgeTempStorage(): Promise<void> {
    await request('/api/system/purge-temp', { method: 'POST' });
  }
};
