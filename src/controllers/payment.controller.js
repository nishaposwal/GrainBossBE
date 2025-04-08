import Payment from '../models/payment.model.js';
import Customer from '../models/customer.model.js';

export const recordPayment = async (req, res) => {
  try {
    const { customerId, amount, type, description, date } = req.body;

    // Validate customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Create payment record
    const payment = new Payment({
      customerId,
      amount,
      type,
      description,
      date: date || new Date()
    });

    // Update customer balance based on payment type
    if (type === 'PAYMENT_RECEIVED') {
      // Reduce customer's balance when they pay us
      customer.balance -= amount;
    } else if (type === 'PAYMENT_MADE') {
      // Increase customer's balance when we pay them
      customer.balance += amount;
    }

    // Save both payment and updated customer balance
    await Promise.all([
      payment.save(),
      customer.save()
    ]);

    // Return payment details with updated customer balance
    res.status(201).json({
      payment,
      updatedBalance: customer.balance
    });

  } catch (error) {
    console.error('Error in recordPayment:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors 
    });
  }
};

export const getCustomerPayments = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const payments = await Payment.find({ customerId })
      .sort({ date: -1 });
      
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Find customer and reverse the balance change
    const customer = await Customer.findById(payment.customerId);
    if (customer) {
      if (payment.type === 'PAYMENT_RECEIVED') {
        customer.balance += payment.amount; // Add back to balance
      } else if (payment.type === 'PAYMENT_MADE') {
        customer.balance -= payment.amount; // Subtract from balance
      }
      await customer.save();
    }

    await Payment.deleteOne({ _id: payment._id });
    res.json({ 
      message: 'Payment deleted successfully',
      updatedBalance: customer?.balance 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 