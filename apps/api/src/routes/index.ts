import { Router } from 'express';
import authRoutes from './auth.routes';
import tenantRoutes from './tenant.routes';
import leadRoutes from './lead.routes';
import customerRoutes from './customer.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import quoteRoutes from './quote.routes';
import packageRoutes from './package.routes';
import groupRoutes from './group.routes';
import documentRoutes from './document.routes';
import communicationRoutes from './communication.routes';
import notificationRoutes from './notification.routes';
import reviewRoutes from './review.routes';
import taskRoutes from './task.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

// API info
router.get('/', (req, res) => {
  res.json({
    name: 'OmraFlow Pro API',
    version: '1.0.0',
    description: 'SaaS platform for Omra agency management',
    documentation: '/api/docs',
  });
});

// Routes
router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/leads', leadRoutes);
router.use('/customers', customerRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/quotes', quoteRoutes);
router.use('/packages', packageRoutes);
router.use('/groups', groupRoutes);
router.use('/documents', documentRoutes);
router.use('/communications', communicationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reviews', reviewRoutes);
router.use('/tasks', taskRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
