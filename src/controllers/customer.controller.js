import Customer from '../models/customer.model.js';
import Transaction from '../models/transaction.model.js';

export const createCustomer = async (req, res) => {
  try {
    const { name, phoneNumber, balance } = req.body;
    console.log('\x1b[32m', name, phoneNumber, balance);
    const customer = new Customer({ name, phoneNumber, balance });
    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ customerId: req.params.id })
      .populate('commodityId')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCustomerByPhone = async (req, res) => {
  try {
    const customer = await Customer.findOne({ phoneNumber: req.params.phone });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createOrUpdateCustomer = async (req, res) => {
  try {
    const { phoneNumber, name, balance } = req.body;

    // Log the request body to verify data
    console.log('Request body:', req.body);

    // Find customer by phone number
    let customer = await Customer.findOne({ phoneNumber });

    if (customer) {
      // Update existing customer
      customer.name = name || customer.name;
      customer.balance = balance !== undefined ? balance : customer.balance;
      await customer.save();
    } else {
      // Create new customer
      customer = new Customer({
        name,
        phoneNumber,  // Make sure this matches exactly
        balance: balance || 0
      });
      await customer.save();
    }

    res.json(customer);
  } catch (error) {
    console.warn('Error in createOrUpdateCustomer:', error);
    res.status(400).json({ message: error.message });
  }
};

// Add a helper function to find customer by phone
export const findCustomerByPhone = async (req, res) => {
  try {
    const customer = await Customer.findOne({ phoneNumber: req.params.phone });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 