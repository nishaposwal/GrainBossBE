import express from 'express';
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getExpenseById
} from '../controllers/expense.controller.js';

const router = express.Router();

router.post('/', createExpense);
router.get('/', getExpenses);
router.get('/:id', getExpenseById);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router; 