import mongoose from 'mongoose';

const earningSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['PICKUP', 'DELIVERY', 'OTHER'],
    required: true
  },
  // Optional reference to related transaction/customer if applicable
  relatedDocId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  },

  paymentMode: {
    type: String,
    enum: ['CASH', 'BANK', 'UPI', 'PENDING'],
    required: true
  },

  // Optional reference to related transaction/customer
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  // Pending payment details
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

export default mongoose.model('Earning', earningSchema); 