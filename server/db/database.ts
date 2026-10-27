import fs from 'fs';
import path from 'path';
import os from 'os';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  isTemp?: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  currency: string;
  monthly_pocket_money: number;
  savings_target: number;
  expected_pocket_day: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
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
  user_id: string;
  category: string; // 'Overall' or category name
  amount: number;
  month: string; // YYYY-MM
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  deadline?: string; // YYYY-MM-DD
  status: 'in_progress' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchema {
  users: User[];
  profiles: Profile[];
  transactions: Transaction[];
  budgets: Budget[];
  savings_goals: SavingsGoal[];
}

// Temporary storage: volatile OS temp directory and RAM
const TEMP_DB_FILE = path.join(os.tmpdir(), `spendsense_temp_${process.pid}.json`);

export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';
export const DEMO_EMAIL = 'aarav@student.edu';

class DatabaseStore {
  // Pure in-memory temporary storage
  private data: DatabaseSchema = {
    users: [],
    profiles: [],
    transactions: [],
    budgets: [],
    savings_goals: []
  };

  constructor() {
    this.init();
  }

  private init() {
    // Check if temporary OS temp file exists from current process
    if (fs.existsSync(TEMP_DB_FILE)) {
      try {
        const raw = fs.readFileSync(TEMP_DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.users.some(u => u.id === DEMO_USER_ID)) {
          this.seedDemoData();
        }
      } catch {
        this.seedDemoData();
      }
    } else {
      this.seedDemoData();
    }
  }

  private persist() {
    // Write exclusively to volatile temporary location
    try {
      fs.writeFileSync(TEMP_DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      // Non-fatal if temp file is unavailable; memory store remains authoritative
      console.warn('Temporary storage disk sync notice (in-memory remains active):', err);
    }
  }

  public seedDemoData() {
    const passwordHash = bcrypt.hashSync('password123', 8);
    const now = new Date();
    const nowIso = now.toISOString();

    const getDateAgo = (days: number): string => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM

    // 1. Demo User
    const demoUser: User = {
      id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      password_hash: passwordHash,
      created_at: getDateAgo(35)
    };

    // 2. Demo Profile
    const demoProfile: Profile = {
      id: DEMO_USER_ID,
      full_name: 'Aarav Sharma',
      currency: '₹',
      monthly_pocket_money: 9500,
      savings_target: 2500,
      expected_pocket_day: 1,
      created_at: getDateAgo(35),
      updated_at: nowIso
    };

    // Replace demo records in temporary memory
    this.data.users = this.data.users.filter(u => u.id !== DEMO_USER_ID).concat(demoUser);
    this.data.profiles = this.data.profiles.filter(p => p.id !== DEMO_USER_ID).concat(demoProfile);
    this.data.transactions = this.data.transactions.filter(t => t.user_id !== DEMO_USER_ID);
    this.data.budgets = this.data.budgets.filter(b => b.user_id !== DEMO_USER_ID);
    this.data.savings_goals = this.data.savings_goals.filter(s => s.user_id !== DEMO_USER_ID);

    // 3. Transactions (30+ realistic student transactions in temporary memory)
    const demoTransactions: Transaction[] = [
      {
        id: 'tx-inc-01',
        user_id: DEMO_USER_ID,
        type: 'income',
        amount: 8500,
        category: 'Pocket money',
        description: 'Monthly pocket money from parents',
        transaction_date: getDateAgo(25),
        payment_method: 'Bank Transfer',
        notes: 'Monthly allowance for food, commute and dorm supplies',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-inc-02',
        user_id: DEMO_USER_ID,
        type: 'income',
        amount: 1500,
        category: 'Freelance work',
        description: 'React landing page for college tech club',
        transaction_date: getDateAgo(14),
        payment_method: 'UPI',
        notes: 'Freelance gig',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-inc-03',
        user_id: DEMO_USER_ID,
        type: 'income',
        amount: 600,
        category: 'Gifts',
        description: 'Festival treat gift from grandparents',
        transaction_date: getDateAgo(7),
        payment_method: 'Cash',
        notes: 'Diwali blessing money',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-01',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 180,
        category: 'Food and snacks',
        description: 'Campus Canteen lunch & ginger tea with study group',
        transaction_date: getDateAgo(24),
        payment_method: 'UPI',
        notes: 'Shared cafeteria bill',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-02',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 260,
        category: 'Food and snacks',
        description: 'Evening Paneer Biryani bowl near hostel',
        transaction_date: getDateAgo(22),
        payment_method: 'UPI',
        notes: 'Dinner with roommate',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-03',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 90,
        category: 'Food and snacks',
        description: 'Chai and samosa snack after exam',
        transaction_date: getDateAgo(20),
        payment_method: 'Cash',
        notes: 'Exam celebration',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-04',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 340,
        category: 'Food and snacks',
        description: 'Dorm late-night pizza share',
        transaction_date: getDateAgo(18),
        payment_method: 'UPI',
        notes: 'Shared Dominoes',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-05',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 120,
        category: 'Food and snacks',
        description: 'Cold coffee & cookies at library study cafe',
        transaction_date: getDateAgo(15),
        payment_method: 'UPI',
        notes: 'Study session',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-06',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 220,
        category: 'Food and snacks',
        description: 'Hostel mess top-up & seasonal fruits',
        transaction_date: getDateAgo(12),
        payment_method: 'UPI',
        notes: 'Bananas and apples for room',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-07',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 160,
        category: 'Food and snacks',
        description: 'Shawarma roll after late lab session',
        transaction_date: getDateAgo(9),
        payment_method: 'UPI',
        notes: 'Dinner',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-08',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 85,
        category: 'Food and snacks',
        description: 'Canteen sandwich and fresh lime soda',
        transaction_date: getDateAgo(6),
        payment_method: 'Cash',
        notes: 'Break snacks',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-09',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 210,
        category: 'Food and snacks',
        description: 'South Indian breakfast combo (Dosa & filter coffee)',
        transaction_date: getDateAgo(3),
        payment_method: 'UPI',
        notes: 'Weekend morning breakfast',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-10',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 140,
        category: 'Food and snacks',
        description: 'Momos and iced lemon tea with batchmates',
        transaction_date: getDateAgo(1),
        payment_method: 'UPI',
        notes: 'Evening snack',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-11',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 450,
        category: 'College expenses',
        description: 'Computer Networks paperback textbook & notes',
        transaction_date: getDateAgo(23),
        payment_method: 'UPI',
        notes: 'Academic book from campus bookstore',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-12',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 130,
        category: 'College expenses',
        description: 'Practical lab manuals and Arduino sensor jumper wires',
        transaction_date: getDateAgo(16),
        payment_method: 'Cash',
        notes: 'Electronics lab components',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-13',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 80,
        category: 'College expenses',
        description: 'Mini-project documentation color printouts & spiral binding',
        transaction_date: getDateAgo(7),
        payment_method: 'UPI',
        notes: 'Submission report',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-14',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 350,
        category: 'Transportation',
        description: 'Monthly student smart card metro recharge',
        transaction_date: getDateAgo(25),
        payment_method: 'UPI',
        notes: 'Daily commute pass',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-15',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 120,
        category: 'Transportation',
        description: 'Shared auto-rickshaw fare in heavy rain',
        transaction_date: getDateAgo(17),
        payment_method: 'Cash',
        notes: 'To tech workshop',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-16',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 90,
        category: 'Transportation',
        description: 'Rapido bike ride to seminar venue',
        transaction_date: getDateAgo(10),
        payment_method: 'UPI',
        notes: 'Fast travel to beat traffic',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-17',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 60,
        category: 'Transportation',
        description: 'City bus ticket return from central library',
        transaction_date: getDateAgo(4),
        payment_method: 'Cash',
        notes: 'Bus ticket',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-18',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 699,
        category: 'Shopping',
        description: 'Department tech fest hoodie',
        transaction_date: getDateAgo(19),
        payment_method: 'UPI',
        notes: 'College merchandise',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-19',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 320,
        category: 'Shopping',
        description: 'Stationery pack: sticky notes, gel pens, A4 folder',
        transaction_date: getDateAgo(13),
        payment_method: 'UPI',
        notes: 'Semester stationery',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-20',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 380,
        category: 'Entertainment',
        description: 'IMAX movie ticket with classmates',
        transaction_date: getDateAgo(21),
        payment_method: 'UPI',
        notes: 'Interstellar special screening',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-21',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 199,
        category: 'Entertainment',
        description: 'Spotify Student Premium 3-month recharge',
        transaction_date: getDateAgo(15),
        payment_method: 'UPI',
        notes: 'Music for study focus',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-22',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 349,
        category: 'Mobile and internet',
        description: 'Jio 5G Unlimited 84-day student pack recharge',
        transaction_date: getDateAgo(22),
        payment_method: 'UPI',
        notes: 'Quarterly mobile recharge',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'tx-exp-23',
        user_id: DEMO_USER_ID,
        type: 'expense',
        amount: 170,
        category: 'Health',
        description: 'Pharmacy: paracetamol, throat lozenges & multivitamin',
        transaction_date: getDateAgo(11),
        payment_method: 'UPI',
        notes: 'Monsoon cold recovery',
        created_at: nowIso,
        updated_at: nowIso
      }
    ];

    this.data.transactions.push(...demoTransactions);

    // 4. Budgets
    const demoBudgets: Budget[] = [
      {
        id: 'bg-01',
        user_id: DEMO_USER_ID,
        category: 'Overall',
        amount: 7200,
        month: currentMonth,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'bg-02',
        user_id: DEMO_USER_ID,
        category: 'Food and snacks',
        amount: 2800,
        month: currentMonth,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'bg-03',
        user_id: DEMO_USER_ID,
        category: 'Transportation',
        amount: 800,
        month: currentMonth,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'bg-04',
        user_id: DEMO_USER_ID,
        category: 'College expenses',
        amount: 1200,
        month: currentMonth,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'bg-05',
        user_id: DEMO_USER_ID,
        category: 'Entertainment',
        amount: 800,
        month: currentMonth,
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'bg-06',
        user_id: DEMO_USER_ID,
        category: 'Shopping',
        amount: 1000,
        month: currentMonth,
        created_at: nowIso,
        updated_at: nowIso
      }
    ];
    this.data.budgets.push(...demoBudgets);

    // 5. Savings Goals
    const demoSavingsGoals: SavingsGoal[] = [
      {
        id: 'sg-01',
        user_id: DEMO_USER_ID,
        title: 'Noise-canceling Coding Headphones',
        target_amount: 4500,
        saved_amount: 2800,
        deadline: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
        status: 'in_progress',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'sg-02',
        user_id: DEMO_USER_ID,
        title: 'Semester End Goa Road Trip',
        target_amount: 8000,
        saved_amount: 3200,
        deadline: new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0],
        status: 'in_progress',
        created_at: nowIso,
        updated_at: nowIso
      },
      {
        id: 'sg-03',
        user_id: DEMO_USER_ID,
        title: 'Emergency Medical & Travel Fund',
        target_amount: 3000,
        saved_amount: 3000,
        deadline: getDateAgo(5),
        status: 'completed',
        created_at: nowIso,
        updated_at: nowIso
      }
    ];
    this.data.savings_goals.push(...demoSavingsGoals);

    this.persist();
  }

  // Create Instant Temporary Guest Student User
  public createTempGuestUser(): { user: User; profile: Profile } {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const guestUser: User = {
      id: tempId,
      email: `guest-${tempId.substring(5, 11)}@temporary.spendsense`,
      password_hash: '',
      created_at: nowIso,
      isTemp: true
    };

    const guestProfile: Profile = {
      id: tempId,
      full_name: 'Guest Student (Temporary Session)',
      currency: '₹',
      monthly_pocket_money: 8000,
      savings_target: 2000,
      expected_pocket_day: 1,
      created_at: nowIso,
      updated_at: nowIso
    };

    this.data.users.push(guestUser);
    this.data.profiles.push(guestProfile);

    // Initial default pocket money income for guest so survival predictor works out of the box
    const currentMonth = nowIso.slice(0, 7);
    this.upsertBudget(tempId, 'Overall', 8000, currentMonth);

    this.createTransaction({
      id: `tx-temp-${Date.now()}`,
      user_id: tempId,
      type: 'income',
      amount: 8000,
      category: 'Pocket money',
      description: 'Initial monthly pocket money (Temporary session)',
      transaction_date: nowIso.split('T')[0],
      payment_method: 'UPI',
      notes: 'Temporary memory credit',
      created_at: nowIso,
      updated_at: nowIso
    });

    this.persist();
    return { user: guestUser, profile: guestProfile };
  }

  // Purge/Reset Temporary Storage completely
  public purgeTempStorage() {
    this.data = {
      users: [],
      profiles: [],
      transactions: [],
      budgets: [],
      savings_goals: []
    };
    try {
      if (fs.existsSync(TEMP_DB_FILE)) {
        fs.unlinkSync(TEMP_DB_FILE);
      }
    } catch {
      // ignore
    }
    this.seedDemoData();
  }

  // User Operations
  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.persist();
    return user;
  }

  // Profile Operations
  public getProfile(userId: string): Profile | undefined {
    return this.data.profiles.find(p => p.id === userId);
  }

  public createProfile(profile: Profile): Profile {
    this.data.profiles.push(profile);
    this.persist();
    return profile;
  }

  public updateProfile(userId: string, updates: Partial<Profile>): Profile | undefined {
    const profile = this.data.profiles.find(p => p.id === userId);
    if (!profile) return undefined;
    Object.assign(profile, updates, { updated_at: new Date().toISOString() });
    this.persist();
    return profile;
  }

  // Transaction Operations
  public getTransactions(userId: string): Transaction[] {
    return this.data.transactions.filter(t => t.user_id === userId);
  }

  public getTransactionById(userId: string, id: string): Transaction | undefined {
    return this.data.transactions.find(t => t.id === id && t.user_id === userId);
  }

  public createTransaction(tx: Transaction): Transaction {
    this.data.transactions.push(tx);
    this.persist();
    return tx;
  }

  public updateTransaction(userId: string, id: string, updates: Partial<Transaction>): Transaction | undefined {
    const tx = this.data.transactions.find(t => t.id === id && t.user_id === userId);
    if (!tx) return undefined;
    Object.assign(tx, updates, { updated_at: new Date().toISOString() });
    this.persist();
    return tx;
  }

  public deleteTransaction(userId: string, id: string): boolean {
    const index = this.data.transactions.findIndex(t => t.id === id && t.user_id === userId);
    if (index === -1) return false;
    this.data.transactions.splice(index, 1);
    this.persist();
    return true;
  }

  // Budget Operations
  public getBudgets(userId: string, month?: string): Budget[] {
    return this.data.budgets.filter(b => b.user_id === userId && (!month || b.month === month));
  }

  public upsertBudget(userId: string, category: string, amount: number, month: string): Budget {
    let budget = this.data.budgets.find(b => b.user_id === userId && b.category === category && b.month === month);
    const nowIso = new Date().toISOString();
    if (budget) {
      budget.amount = amount;
      budget.updated_at = nowIso;
    } else {
      budget = {
        id: `bg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: userId,
        category,
        amount,
        month,
        created_at: nowIso,
        updated_at: nowIso
      };
      this.data.budgets.push(budget);
    }
    this.persist();
    return budget;
  }

  public deleteBudget(userId: string, id: string): boolean {
    const index = this.data.budgets.findIndex(b => b.id === id && b.user_id === userId);
    if (index === -1) return false;
    this.data.budgets.splice(index, 1);
    this.persist();
    return true;
  }

  // Savings Goal Operations
  public getSavingsGoals(userId: string): SavingsGoal[] {
    return this.data.savings_goals.filter(s => s.user_id === userId);
  }

  public createSavingsGoal(goal: SavingsGoal): SavingsGoal {
    this.data.savings_goals.push(goal);
    this.persist();
    return goal;
  }

  public updateSavingsGoal(userId: string, id: string, updates: Partial<SavingsGoal>): SavingsGoal | undefined {
    const goal = this.data.savings_goals.find(s => s.id === id && s.user_id === userId);
    if (!goal) return undefined;
    Object.assign(goal, updates, { updated_at: new Date().toISOString() });
    if (goal.saved_amount >= goal.target_amount && goal.status !== 'completed') {
      goal.status = 'completed';
    }
    this.persist();
    return goal;
  }

  public deleteSavingsGoal(userId: string, id: string): boolean {
    const index = this.data.savings_goals.findIndex(s => s.id === id && s.user_id === userId);
    if (index === -1) return false;
    this.data.savings_goals.splice(index, 1);
    this.persist();
    return true;
  }

  public getStats() {
    return {
      storageMode: 'Temporary In-Memory Storage (RAM / os.tmpdir)',
      tempLocation: TEMP_DB_FILE,
      usersCount: this.data.users.length,
      transactionsCount: this.data.transactions.length,
      budgetsCount: this.data.budgets.length,
      savingsGoalsCount: this.data.savings_goals.length
    };
  }
}

export const db = new DatabaseStore();
