import { Router } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// CRUD routes for customers - similar pattern to leads
router.get('/', async (req, res) => res.json({ success: true, data: [], meta: {} }));
router.get('/:id', async (req, res) => res.json({ success: true, data: {} }));
router.post('/', async (req, res) => res.status(201).json({ success: true, data: {} }));
router.patch('/:id', async (req, res) => res.json({ success: true, data: {} }));
router.delete('/:id', async (req, res) => res.json({ success: true, message: 'Deleted' }));

export default router;
