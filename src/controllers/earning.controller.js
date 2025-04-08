import Earning from '../models/earning.model.js';
import Customer from '../models/customer.model.js';
import Payment from '../models/payment.model.js';

export const createEarning = async (req, res) => {
  try {
    const earning = new Earning(req.body);
    
    // Handle pending payment customer details
    if (earning.paymentMode === 'PENDING' && earning.pendingDetails) {
      const { mobileNumber, name, pendingAmount } = earning.pendingDetails;
      
      // Find or create customer
      let customer = await Customer.findOne({ phoneNumber: mobileNumber });
      
      if (customer) {
        // Update existing customer's balance
        customer.balance = (customer.balance || 0) + pendingAmount;
        await customer.save();

        // Record payment for existing customer
        const payment = new Payment({
          amount: pendingAmount,
          customerId: customer._id,
          type: 'PAYMENT_MADE',
          date: earning.date,
          description: `Pending payment for ${earning.description}`,
          relatedDocId: earning._id
        });
        await payment.save();
      } else {
        // Create new customer
        customer = new Customer({
          name,
          phoneNumber: mobileNumber,
          balance:  pendingAmount,
        });
        await customer.save();

        // Record payment for new customer
        const payment = new Payment({
          amount: pendingAmount,
          customerId: customer._id,
          type: 'PAYMENT_MADE',
          date: earning.date,
          description: `Initial pending payment for ${earning.description}`,
          relatedDocId: earning._id
        });
        await payment.save();
      }
      
      // Link customer to earning
      earning.customerId = customer._id;
    }
    
    await earning.save();
    res.status(201).json(earning);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getEarnings = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    // Build query filters
    const query = {};
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Add type filter if provided
    if (type) {
      query.type = type;
    }

    const earnings = await Earning.find(query)
      .populate('customerId', 'name phoneNumber balance')
      .sort({ date: -1 });
      
    // Calculate total
    const total = earnings.reduce((sum, earning) => sum + earning.amount, 0);

    res.json({
      earnings,
      total,
      count: earnings.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEarning = async (req, res) => {
  try {
    const earning = await Earning.findById(req.params.id);
    if (!earning) {
      return res.status(404).json({ message: 'Earning not found' });
    }

    // Handle changes in payment mode and customer details
    if (earning.paymentMode !== req.body.paymentMode) {
      // If previously pending, update old customer's balance
      if (earning.paymentMode === 'PENDING' && earning.customerId) {
        const oldCustomer = await Customer.findById(earning.customerId);
        if (oldCustomer) {
          oldCustomer.balance += earning.pendingDetails.pendingAmount;
          await oldCustomer.save();
        }
      }

      // If new mode is pending, handle new customer
      if (req.body.paymentMode === 'PENDING' && req.body.pendingDetails) {
        const { mobileNumber, name, pendingAmount } = req.body.pendingDetails;
        
        let customer = await Customer.findOne({ phoneNumber: mobileNumber });
        
        if (customer) {
          customer.balance = (customer.balance || 0) - pendingAmount;
          await customer.save();
        } else {
          customer = new Customer({
            name,
            phoneNumber: mobileNumber,
            balance: -1 * pendingAmount,
          });
          await customer.save();
        }
        
        req.body.customerId = customer._id;
      } else {
        req.body.customerId = null;
      }
    }

    Object.assign(earning, req.body);
    await earning.save();

    res.json(earning);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEarning = async (req, res) => {
  try {
    const earning = await Earning.findById(req.params.id);
    if (!earning) {
      return res.status(404).json({ message: 'Earning not found' });
    }

    await Earning.deleteOne({ _id: earning._id });
    res.json({ message: 'Earning deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEarningStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date range query
    const dateQuery = {};
    if (startDate || endDate) {
      dateQuery.date = {};
      if (startDate) dateQuery.date.$gte = new Date(startDate);
      if (endDate) dateQuery.date.$lte = new Date(endDate);
    }

    // Get earnings grouped by type
    const earningsByType = await Earning.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total earnings
    const totalEarnings = await Earning.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      byType: earningsByType,
      total: totalEarnings[0] || { total: 0, count: 0 }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 