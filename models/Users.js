const mongoose = require('mongoose');
const { Schema } = mongoose;
const forge = require('node-forge');

// Define a function to generate a key pair
function generateKeyPair() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  return {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    publicKey: forge.pki.publicKeyToPem(keys.publicKey),
  };
}

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  publicKey: {
    type: Buffer, // Store the user's public key as a Buffer
  },
  privateKey: {
    type: Buffer, // Store the user's private key as a Buffer
  },
  date: {
    type: Date,
    default: Date.now,
  },
});
// Middleware to generate public and private keys when creating a new user
UserSchema.pre('save', async function (next) {
  if (!this.privateKey) {
    const keyPair = generateKeyPair();
    this.privateKey = Buffer.from(keyPair.privateKey, 'utf-8'); // Use 'utf-8' encoding
  }

  if (!this.publicKey) {
    const keyPair = generateKeyPair();
    this.publicKey = Buffer.from(keyPair.publicKey, 'utf-8'); // Use 'utf-8' encoding
  }

  next();
});

module.exports = mongoose.model('user', UserSchema);
