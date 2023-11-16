const mongoose = require('mongoose');
const { Schema } = mongoose;

const contractSchema = new Schema({
    seller: {
        type: Schema.Types.ObjectId,
        ref: 'user', // Reference to the user model for the seller
        required: true,
    },
    buyer: {
        type: Schema.Types.ObjectId,
        ref: 'user', // Reference to the user model for the buyer
        required: true,
    },
    property: {
        type: Schema.Types.ObjectId,
        ref: 'property', // Reference to the property model
        required: true,
    },
    type: {
        type: String,
        enum: ['rent', 'buy'],
        required: true,
    },
    terms: {
        type: String, // You can adjust the data type to store terms in the desired format (e.g., text or JSON)
        required: true,
    },
    signature: {
        type: String, // Store the digital signature
        required: true,
    },
    status: {
        type: String,
        enum: ['sent', 'accepted', 'rejected','completed'],
        default: 'sent', // Default status is 'sent'
        required: true,
    },
    // Additional contract fields, if needed
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

const Contract = mongoose.model('contract', contractSchema);

module.exports = Contract;
