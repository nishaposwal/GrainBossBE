import mongoose from 'mongoose';
import { COMMODITY_UNIT_TO_KG_MAPPING } from '../constants/units.js';

const transactionSchema = new mongoose.Schema({
  commodityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Commodity',
    required: true
  },
  type: {
    type: String,
    enum: ['STOCK_IN', 'STOCK_OUT'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  qtyInKG: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: Object.keys(COMMODITY_UNIT_TO_KG_MAPPING),
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  paymentMode: {
    type: String,
    enum: ['CASH', 'BANK', 'UPI', 'PENDING'],
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  pendingDetails: {
    type: {
      name: String,
      mobileNumber: String,
      pendingAmount: Number
    },
    required: function() {
      return this.paymentMode === 'PENDING';
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('Transaction', transactionSchema); 