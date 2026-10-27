import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db, DEMO_USER_ID, DEMO_EMAIL } from '../db/database.ts';
import { generateToken, authenticate, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email address required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  currency: z.string().default('₹'),
  monthlyPocketMoney: z.number().min(0).default(8000),
  savingsTarget: z.number().min(0).default(2000),
  expectedPocketDay: z.number().min(1).max(31).default(1)
});

const loginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(1, 'Password is required')
});

const profileUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  currency: z.string().min(1).max(5).optional(),
  monthlyPocketMoney: z.number().min(0).optional(),
  savingsTarget: z.number().min(0).optional(),
  expectedPocketDay: z.number().min(1).max(31).optional()
});

// Register
router.post('/register', (req, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Validation error'
      });
      return;
    }

    const { fullName, email, password, currency, monthlyPocketMoney, savingsTarget, expectedPocketDay } = parsed.data;

    const existing = db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
      return;
    }

    const userId = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const nowIso = new Date().toISOString();

    const user = db.createUser({
      id: userId,
      email: email.toLowerCase().trim(),
      password_hash: passwordHash,
      created_at: nowIso
    });

    const profile = db.createProfile({
      id: userId,
      full_name: fullName.trim(),
      currency: currency || '₹',
      monthly_pocket_money: monthlyPocketMoney,
      savings_target: savingsTarget,
      expected_pocket_day: expectedPocketDay,
      created_at: nowIso,
      updated_at: nowIso
    });

    // Create default overall budget for current month
    const currentMonth = nowIso.slice(0, 7);
    db.upsertBudget(userId, 'Overall', monthlyPocketMoney, currentMonth);

    const token = generateToken({ id: user.id, email: user.email, full_name: profile.full_name });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        currency: profile.currency,
        monthly_pocket_money: profile.monthly_pocket_money,
        savings_target: profile.savings_target,
        expected_pocket_day: profile.expected_pocket_day
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Registration failed due to an unexpected error' });
  }
});

// Login
router.post('/login', (req, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid input'
      });
      return;
    }

    const { email, password } = parsed.data;
    const user = db.findUserByEmail(email);

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
      return;
    }

    const profile = db.getProfile(user.id) || {
      id: user.id,
      full_name: 'Student User',
      currency: '₹',
      monthly_pocket_money: 8000,
      savings_target: 2000,
      expected_pocket_day: 1,
      created_at: user.created_at,
      updated_at: user.created_at
    };

    const token = generateToken({ id: user.id, email: user.email, full_name: profile.full_name });

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        currency: profile.currency,
        monthly_pocket_money: profile.monthly_pocket_money,
        savings_target: profile.savings_target,
        expected_pocket_day: profile.expected_pocket_day
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Internal login error' });
  }
});

// Instant Demo Login (Aarav Sharma - Student Demo)
router.post('/demo-login', (_req, res: Response) => {
  try {
    const user = db.findUserById(DEMO_USER_ID) || db.findUserByEmail(DEMO_EMAIL);
    if (!user) {
      db.seedDemoData();
    }

    const demoUser = db.findUserById(DEMO_USER_ID)!;
    const demoProfile = db.getProfile(DEMO_USER_ID)!;

    const token = generateToken({
      id: demoUser.id,
      email: demoUser.email,
      full_name: demoProfile.full_name
    });

    res.json({
      success: true,
      message: 'Logged in as Demo Student (Aarav Sharma)',
      isDemo: true,
      token,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        full_name: demoProfile.full_name,
        currency: demoProfile.currency,
        monthly_pocket_money: demoProfile.monthly_pocket_money,
        savings_target: demoProfile.savings_target,
        expected_pocket_day: demoProfile.expected_pocket_day
      }
    });
  } catch (err) {
    console.error('Demo login error:', err);
    res.status(500).json({ success: false, error: 'Failed to initialize demo session' });
  }
});

// Instant Temporary Guest Session (Temporary in-memory storage)
router.post('/temp-session', (_req, res: Response) => {
  try {
    const { user, profile } = db.createTempGuestUser();
    const token = generateToken({
      id: user.id,
      email: user.email,
      full_name: profile.full_name
    });

    res.json({
      success: true,
      message: 'Temporary in-memory guest session created',
      isTemp: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        currency: profile.currency,
        monthly_pocket_money: profile.monthly_pocket_money,
        savings_target: profile.savings_target,
        expected_pocket_day: profile.expected_pocket_day,
        isTemp: true
      }
    });
  } catch (err) {
    console.error('Temp session error:', err);
    res.status(500).json({ success: false, error: 'Failed to create temporary session' });
  }
});

// Get Current User Profile
router.get('/me', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const user = db.findUserById(userId);
  const profile = db.getProfile(userId);

  if (!user || !profile) {
    res.status(404).json({ success: false, error: 'User profile not found' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: profile.full_name,
      currency: profile.currency,
      monthly_pocket_money: profile.monthly_pocket_money,
      savings_target: profile.savings_target,
      expected_pocket_day: profile.expected_pocket_day,
      isDemo: user.id === DEMO_USER_ID,
      isTemp: Boolean(user.isTemp)
    }
  });
});

// Update Profile
router.put('/profile', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const parsed = profileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.issues[0]?.message || 'Invalid input data'
      });
      return;
    }

    const { fullName, currency, monthlyPocketMoney, savingsTarget, expectedPocketDay } = parsed.data;

    const updates: Record<string, unknown> = {};
    if (fullName !== undefined) updates.full_name = fullName.trim();
    if (currency !== undefined) updates.currency = currency;
    if (monthlyPocketMoney !== undefined) updates.monthly_pocket_money = monthlyPocketMoney;
    if (savingsTarget !== undefined) updates.savings_target = savingsTarget;
    if (expectedPocketDay !== undefined) updates.expected_pocket_day = expectedPocketDay;

    const updated = db.updateProfile(userId, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: userId,
        email: req.user!.email,
        full_name: updated?.full_name,
        currency: updated?.currency,
        monthly_pocket_money: updated?.monthly_pocket_money,
        savings_target: updated?.savings_target,
        expected_pocket_day: updated?.expected_pocket_day
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

export default router;
