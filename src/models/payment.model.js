import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['PAYMENT_RECEIVED', 'PAYMENT_MADE'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    }
  }
});

export default mongoose.model('Payment', paymentSchema); 

export const COMMODITY_UNIT_TO_KG_MAPPING = {
  KG: 1,
  QUINTAL: 100,
  TONNE: 1000,
  MANN: 40,
  
}