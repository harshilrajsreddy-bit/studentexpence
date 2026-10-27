import { Router, Response } from 'express';
import { db } from '../db/database.ts';

const router = Router();

// System Status and Architecture Info
router.get('/status', (_req, res: Response) => {
  const stats = db.getStats();
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'https://your-project.supabase.co');

  res.json({
    success: true,
    engine: 'Student SpendSense Express & Temporary Storage Engine',
    supabaseCloudReady: true,
    supabaseConfigured: hasSupabaseUrl,
    mode: 'Temporary In-Memory Storage (RAM / os.tmpdir)',
    database: {
      storage: 'Volatile Temporary In-Memory Storage',
      isTemporary: true,
      stats
    },
    architectureExplanation: 'Full-stack Express.js backend operating in fast, volatile temporary in-memory storage (RAM). All demo and session records reside in temporary memory without permanent disk residue.'
  });
});

// Reset Demo Data
router.post('/reset-demo', (_req, res: Response) => {
  try {
    db.seedDemoData();
    res.json({
      success: true,
      message: 'Demo dataset (Aarav Sharma) has been reset in temporary memory.'
    });
  } catch (err) {
    console.error('Reset demo error:', err);
    res.status(500).json({ success: false, error: 'Failed to reset demo dataset' });
  }
});

// Purge All Temporary Storage
router.post('/purge-temp', (_req, res: Response) => {
  try {
    db.purgeTempStorage();
    res.json({
      success: true,
      message: 'Temporary in-memory storage has been completely purged and re-initialized.'
    });
  } catch (err) {
    console.error('Purge error:', err);
    res.status(500).json({ success: false, error: 'Failed to purge temporary storage' });
  }
});

export default router;
