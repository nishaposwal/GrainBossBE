import Expense from '../models/expense.model.js';
import Customer from '../models/customer.model.js';
import Payment from '../models/payment.model.js';

export const createExpense = async (req, res) => {
  try {
    const expense = new Expense(req.body);
    
    // If expense has pending payment details, update or create customer
    if (expense.paymentMode === 'pending' && expense.pendingDetails) {
      const { mobileNumber, name, pendingAmount } = expense.pendingDetails;
      
      // Find or create customer
      let customer = await Customer.findOne({ phoneNumber: mobileNumber });
      
      if (customer) {
        // Update existing customer's balance
        customer.balance = (customer.balance || 0) - pendingAmount;
        await customer.save();

        // Record payment for existing customer update
        const payment = new Payment({
          amount: pendingAmount,
          customerId: customer._id,
          type: 'PAYMENT_RECEIVED',
          date: expense.date,
          description: `Pending payment for ${expense.description}`,
          relatedDocId: expense._id
        });
        await payment.save();
      } else {
        // Create new customer
        customer = new Customer({
          name,
          phoneNumber: mobileNumber,
          balance: -1 * pendingAmount,
        });
        await customer.save();

        // Record payment for new customer
        const payment = new Payment({
          amount: pendingAmount,
          customerId: customer._id,
          type: 'PAYMENT_RECEIVED',
          date: expense.date,
          description: `Initial pending payment for ${expense.description}`,
          relatedDocId: expense._id
        });
        await payment.save();
      }
      
      // Link customer to expense
      expense.customerId = customer._id;
    }
    
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .sort({ date: -1 })
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
     
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // If payment mode is changing to/from pending, handle customer balance
    if (expense.paymentMode !== req.body.paymentMode) {
      if (expense.customerId) {
        const customer = await Customer.findById(expense.customerId);
        if (customer) {
          const oldPendingAmount = expense.pendingDetails?.pendingAmount || 0;
          const newPendingAmount = req.body.pendingDetails?.pendingAmount || 0;
          
          // Reverse previous pending amount
          customer.balance -= oldPendingAmount;
          
          // Add new pending amount if applicable
          if (req.body.paymentMode === 'pending') {
            customer.balance += newPendingAmount;
            
            // Record payment for balance update
            const payment = new Payment({
              amount: newPendingAmount,
              customerId: customer._id,
              type: 'pending',
              date: req.body.date || new Date(),
              description: `Updated pending payment for ${req.body.description}`,
              relatedDocId: expense._id
            });
            await payment.save();
          }
          
          await customer.save();
        }
      }
    }

    Object.assign(expense, req.body);
    await expense.save();
    
    res.json(expense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // If expense was pending, update customer balance
    if (expense.paymentMode === 'pending' && expense.customerId) {
      const customer = await Customer.findById(expense.customerId);
      if (customer) {
        customer.balance -= expense.pendingDetails?.pendingAmount || 0;
        await customer.save();
      }
    }

    // Use deleteOne instead of remove
    await Expense.deleteOne({ _id: expense._id });
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 