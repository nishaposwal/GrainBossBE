import express from 'express';
import {
  createCommodity,
  getCommodities,
  updateCommodity,
  deleteCommodity,
  stockIn,
  stockOut,
  getTransactions
} from '../controllers/commodity.controller.js';

const router = express.Router();

router.post('/', createCommodity);
router.get('/', getCommodities);
router.put('/:id', updateCommodity);
router.delete('/:id', deleteCommodity);

// Stock management routes
router.post('/:id/stock-in', stockIn);
router.post('/:id/stock-out', stockOut);
router.get('/:id/transactions', getTransactions);

export default router; 