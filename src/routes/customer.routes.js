import express from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerTransactions,
  getCustomerByPhone,
  createOrUpdateCustomer,
  findCustomerByPhone
} from '../controllers/customer.controller.js';

const router = express.Router();

router.post('/', createCustomer);
router.get('/', getCustomers);
router.get('/phone/:phone', getCustomerByPhone);
router.post('/create-or-update', createOrUpdateCustomer);
router.get('/:id/transactions', getCustomerTransactions);
router.get('/phone/:phone', findCustomerByPhone);

export default router; 