import Commodity from '../models/commodity.model.js';
import Transaction from '../models/transaction.model.js';
import Customer from '../models/customer.model.js';
import Payment from '../models/payment.model.js';
import { COMMODITY_UNIT_TO_KG_MAPPING } from '../constants/units.js';

export const createCommodity = async (req, res) => {
  try {
    const { name } = req.body;
    const commodity = new Commodity({ name, quantity: 0 });
    await commodity.save();
    res.status(201).json(commodity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getCommodities = async (req, res) => {
  try {
    const commodities = await Commodity.find();
    res.json(commodities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const stockIn = async (req, res) => {
  try {
    const { quantity, unit, price, paymentMode, pendingDetails, description } = req.body;
    const commodityId = req.params.id;

    const commodity = await Commodity.findById(commodityId);
    if (!commodity) {
      return res.status(404).json({ message: 'Commodity not found' });
    }

    // Update commodity quantity
    const qtyInKG = Number(quantity) * COMMODITY_UNIT_TO_KG_MAPPING[unit];
    commodity.quantity += qtyInKG;
    await commodity.save();

    // Create transaction
    const transaction = new Transaction({
      commodityId,
      type: 'STOCK_IN',
      quantity: Number(quantity),
      unit,
      qtyInKG,
      price,
      date: new Date(),
      balanceAfter: commodity.quantity,
      paymentMode,
      description
    });

    // Handle pending payment
    if (paymentMode === 'PENDING' && pendingDetails) {
      const { mobileNumber, name, pendingAmount } = pendingDetails;
      
      // Find or create customer
      let customer = await Customer.findOne({ phoneNumber: mobileNumber });
      
      if (customer) {
        // Update existing customer's balance
        customer.balance = (customer.balance || 0) - pendingAmount;
        await customer.save();

        // Record payment
        const payment = new Payment({
          amount: pendingAmount,
          customerId: customer._id,
          type: 'PAYMENT_RECEIVED',
          date: new Date(),
          description: `Pending payment for stock in - ${commodity.name}`,
          relatedDocId: transaction._id
        });
        await payment.save();
      } else {
        // Create new customer
        customer = new Customer({
          name,
          phoneNumber: mobileNumber,
          balance: -1 * pendingAmount 
        });
        await customer.save();

        // Record payment
        const payment = new Payment({
          amount: pendingAmount,
          customerId: customer._id,
          type: 'PAYMENT_RECEIVED',
          date: new Date(),
          description: `Initial pending payment for stock in - ${commodity.name}`,
          relatedDocId: transaction._id
        });
        await payment.save();
      }
      
      // Link customer to transaction
      transaction.customerId = customer._id;
      transaction.pendingDetails = pendingDetails;
    }

    await transaction.save();

    res.json({ 
      commodity,
      transaction
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const stockOut = async (req, res) => {
  try {
    const { quantity, unit, price, paymentMode, pendingDetails, description } = req.body;
    const commodityId = req.params.id;

    const commodity = await Commodity.findById(commodityId);
    if (!commodity) {
      return res.status(404).json({ message: 'Commodity not found' });
    }

    const qtyInKG = Number(quantity) * COMMODITY_UNIT_TO_KG_MAPPING[unit];
    
    // Check if enough stock available
    if (commodity.quantity < qtyInKG) {
      return res.status(400).json({ 
        message: 'Insufficient stock',
        available: commodity.quantity,
        requested: qtyInKG
      });
    }

    // Update commodity quantity
    commodity.quantity -= qtyInKG;
    await commodity.save();

    // Create transaction
    const transaction = new Transaction({
      commodityId,
      type: 'STOCK_OUT',
      quantity: Number(quantity),
      qtyInKG,
      unit,
      price,
      date: new Date(),
      balanceAfter: commodity.quantity,
      paymentMode,
      description
    });

    // Handle pending payment
    if (paymentMode === 'PENDING' && pendingDetails) {
      const { mobileNumber, name, pendingAmount } = pendingDetails;
      
      // Find or create customer
      let customer = await Customer.findOne({ phoneNumber: mobileNumber });
      
      if (customer) {
        // Update existing customer's balance
        customer.balance = (customer.balance || 0) + pendingAmount;
        await customer.save();

        // Record payment
        const payment = new Payment({
          amount: pendingAmount,
          customerId: customer._id,
          type: 'PAYMENT_MADE',
          date: new Date(),
          description: `Pending payment for stock out - ${commodity.name}`,
          relatedDocId: transaction._id
        });
        await payment.save();
      } else {
        // Create new customer
        customer = new Customer({
          name,
          phoneNumber: mobileNumber,
          balance: pendingAmount
        });
        await customer.save();

        // Record payment
        const payment = new Payment({
          amount: pendingAmount,
          customerId: customer._id,
          type: 'PAYMENT_MADE',
          date: new Date(),
          description: `Initial pending payment for stock out - ${commodity.name}`,
          relatedDocId: transaction._id
        });
        await payment.save();
      }
      
      // Link customer to transaction
      transaction.customerId = customer._id;
      transaction.pendingDetails = pendingDetails;
    }

    await transaction.save();

    res.json({ 
      commodity,
      transaction
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const commodityId = req.params.id;
    
    // Verify commodity exists
    const commodity = await Commodity.findById(commodityId);
    if (!commodity) {
      return res.status(404).json({ message: 'Commodity not found' });
    }

    // Get transactions for this commodity
    const transactions = await Transaction.find({ 
      commodityId 
    }).sort({ date: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCommodity = async (req, res) => {
  try {
    const commodity = await Commodity.findByIdAndDelete(req.params.id);
    if (!commodity) {
      return res.status(404).json({ message: 'Commodity not found' });
    }
    res.json({ message: 'Commodity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCommodity = async (req, res) => {
  try {
    const { name } = req.body;
    const commodityId = req.params.id;

    const commodity = await Commodity.findById(commodityId);
    if (!commodity) {
      return res.status(404).json({ message: 'Commodity not found' });
    }

    commodity.name = name;
    await commodity.save();

    res.json(commodity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 