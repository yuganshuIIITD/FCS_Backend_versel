const mongoose = require('mongoose');
const {Schema}= mongoose;

const transactionSchema = new Schema({
    
    property: {
      type: Schema.Types.ObjectId,
      ref: 'property',
      required: true
    },
    prevowner: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    newowner: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
        type: String,
        enum: ['rent','sell']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  });
  

  const Transaction = mongoose.model('Transaction', transactionSchema);
  
  module.exports = Transaction;