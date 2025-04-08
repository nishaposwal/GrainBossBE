import express from 'express';
import {
  recordPayment,
  getCustomerPayments,
  deletePayment
} from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/', recordPayment);
router.get('/customer/:customerId', getCustomerPayments);
router.delete('/:id', deletePayment);

export default router; 