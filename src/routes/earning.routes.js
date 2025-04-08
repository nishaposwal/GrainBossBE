import express from 'express';
import {
  createEarning,
  getEarnings,
  updateEarning,
  deleteEarning,
  getEarningStats
} from '../controllers/earning.controller.js';

const router = express.Router();

// CRUD routes
router.post('/', createEarning);
router.get('/', getEarnings);
router.put('/:id', updateEarning);
router.delete('/:id', deleteEarning);

// Stats route
router.get('/stats', getEarningStats);

export default router; 