const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const User = require('../models/Users');
const crypto = require('crypto');
const Property = require('../models/Property');

const verify_contract = (contract, publicKey) => {
  try {
    const { signature, ...contractData } = contract.toObject();
    const serializedData = JSON.stringify(contractData);

    console.log('Serialized Data:', serializedData);
    console.log('Signature:', signature);
    console.log('Public Key:', publicKey);

    const verifier = crypto.createVerify('SHA256');
    verifier.update(serializedData);

    const isVerified = verifier.verify(Buffer.from(publicKey, 'base64'), signature, 'base64');

    console.log('Verification Result:', isVerified);

    return !isVerified;
  } catch (error) {
    console.error('Verification error:', error.message);
    return false;
  }
};

// Create a new route for verifying a document
router.post('/verify', async (req, res) => {
  try {
    const contractId = req.body.contractId;

    const contract = await Contract.findById(contractId);
    

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Find the user (buyer) associated with the contract
    const buyer = await User.findById(contract.buyer);
   
    if (!buyer || !buyer.publicKey) {
      return res.status(400).json({ message: 'Buyer not found or public key missing' });
    }
  

    // Verify the contract using the buyer's public key
    const isVerified = verify_contract(contract, buyer.publicKey);
    console.log(isVerified)
    if (isVerified) {
      res.json({ message: 'Contract is verified and authentic' });
    } else {
      res.status(400).json({ message: 'Contract verification failed' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// all contracts where you are the buyer 
router.post('/buyer', async (req, res) => {
 
  try {
    const buyerId = req.body.buyerId; // Assuming the user ID is sent in the request body

    // Find all contracts where the user is the buyer
    const contracts = await Contract.find({ buyer: buyerId });

    // Enhance the contract data with seller names
    const contractsWithSellerNames = await Promise.all(
      contracts.map(async (contract) => {
        const seller = await User.findById(contract.seller);
        const sellerName = seller ? seller.name : 'Unknown Seller';
        console.log(sellerName)
        const property = await Property.findById(contract.property)
        const propertyName = property? property.title :"Unknown"
        console.log(propertyName)

        return {
          ...contract._doc,
          sellerName,
          propertyName,
        };
      })
    );

    res.json(contractsWithSellerNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

//all contracts if you are the seller (rejected waale show ni krne hai)
router.post('/seller', async (req, res) => {
  try {
    const sellerId = req.body.sellerId; // Assuming the user ID is sent in the request body

    // Find all contracts where the user is the seller and the status is not rejected
    const contracts = await Contract.find({ seller: sellerId, status: { $ne: 'rejected' } });

    // Enhance the contract data with buyer names
    const contractsWithBuyerNames = await Promise.all(
      contracts.map(async (contract) => {
        const buyer = await User.findById(contract.buyer);
        const buyerName = buyer ? buyer.name : 'Unknown Buyer';
        const property = await Property.findById(contract.property)
        const propertyName = property? property.title :"Unknown"
       
        return {
          ...contract._doc,
          buyerName,
          propertyName,
        };
      })
    );

    res.json(contractsWithBuyerNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

//seller can reject the contract
router.post('/reject', async (req, res) => {
  try {
    const { sellerId, contractId } = req.body;

    // Check if the seller ID and contract ID are provided
    if (!sellerId || !contractId) {
      return res.status(400).json({ message: 'Seller ID and Contract ID are required' });
    }

    // Find the contract to update
    const contract = await Contract.findOne({ _id: contractId, seller: sellerId, status: 'sent' });

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found or cannot be rejected' });
    }

    // Update the contract status to 'rejected'
    contract.status = 'rejected';
    await contract.save();

    res.json({ message: 'Contract rejected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

//seller can accept , ye hone ke baad apna payments ka start krdena 
router.post('/accept', async (req, res) => {
  try {
    const { sellerId, contractId } = req.body;

    // Check if the seller ID and contract ID are provided
    if (!sellerId || !contractId) {
      return res.status(400).json({ message: 'Seller ID and Contract ID are required' });
    }

    // Find the contract to update
    const contract = await Contract.findOne({ _id: contractId, seller: sellerId, status: 'sent' });

    if (!contract) {
      return res.status(404).json({ message: 'Contract not found or cannot be accepted' });
    }

    // Update the contract status to 'accepted'
    contract.status = 'accepted';
    await contract.save();

    res.json({ message: 'Contract accepted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// to update the contract to "updated" after the payment is succesfull 
router.get('/completed', async (req, res) => {
  try {
    const buyerId = req.body.buyerId;
    const propertyId = req.body.propertyId;
    // console.log(buyerId);
    // console.log(propertyId);

    const updatedContract = await Contract.findOneAndUpdate(
      {
        buyer: buyerId,
        property: propertyId,
      },
      
      { $set: { status: 'completed' } },
      { new: true } // Return the updated document
    );

    if (!updatedContract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    res.json(updatedContract);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }

});

router.get('/checkSoldStatus/:contractId', async (req, res) => {
  try {
    const contractId = req.params.contractId;

    // Find the contract using the contractId
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const propertyId = contract.property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    let status = property.status

   
    // Check if the contract status is "sold"
    const isSold = status === 'sold';

    res.json({ isSold });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
