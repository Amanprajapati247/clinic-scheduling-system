import { Router } from 'express';
import authRoutes from './authRoutes';
import slotRoutes from './slotRoutes';
import scheduleRoutes from './scheduleRoutes';
import appointmentRoutes from './appointmentRoutes';
import visitNoteRoutes from './visitNoteRoutes';
import timelineRoutes from './timelineRoutes';
import dashboardRoutes from './dashboardRoutes';
import alertRoutes from './alertRoutes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.use('/auth', authRoutes);
router.use('/slots', slotRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/notes', visitNoteRoutes);
router.use('/timeline', timelineRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/alerts', alertRoutes);

export default router;
