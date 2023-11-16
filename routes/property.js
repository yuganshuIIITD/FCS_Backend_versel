const express = require('express');
const User = require('../models/Users');
const Contract = require('../models/Contract')
const router = express.Router();
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');
const Property = require('../models/Property');
const JWT_SECRET = 'armoni@Yu';

// ROUTE 1: Get loggedin User to add property Details using: POST "/api/property/addnew" || Login required
router.post('/addnew', fetchuser, [
  body('title').custom((value, { req }) => {
      if (!value || value.length < 3) {
        throw new Error('Title should be at least 3 characters long.');
      }
      return true;
    }),
  
    body('description').custom((value, { req }) => {
      if (value && value.length > 50) {
        throw new Error('Description should not exceed 50 characters.');
      }
      return true;
    }),
  
    body('images', 'Images should be an array if provided.')
      .optional(),
    body('location').custom((value, { req }) => {
      if (!value || value.length < 3) {
        throw new Error('Location should be at least 5 characters long.');
      }
      return true;
    }),
  
    body('price').custom((value, { req }) => {
      if (!value || isNaN(value)) {
        throw new Error('Enter a valid price');
      }
      return true;
    }),
    
    body('listing_type').custom((value, { req }) => {
      if (!['rent', 'sell'].includes(value)) {
        throw new Error('Listing type should be either: rent OR sell');
      }
      return true;
    }),
],  async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(400).json({ errors: errors.array() });
  }
  try {
    const property = await Property.create({
      title: req.body.title,
      description: req.body.description || null,
      images:req.body.images || null,
      location:req.body.location,
      price: req.body.price,
      owner: req.user.id,
      listing_type: req.body.listing_type,
      status: "available"
    });
    res.send(property)
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})

// Route 2 fetch the listings of the logged in user || logged in required
router.get('/fetchmylistings', fetchuser, async (req, res) => {
  try {
    const properties = await Property.find({ owner: req.user.id, transacted:"no"});
    res.json(properties);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Route 3 delete the listings of the logged in user || logged in required
router.delete('/deleteproperty/:id', fetchuser, async (req, res) => {
  try {
      let property = await Property.findById(req.params.id);
      if (!property) { return res.status(404).send("Not Found") }
      if (property.owner.toString() !== req.user.id) {
          return res.status(401).send("Not Allowed");
      }
      property = await Property.findByIdAndDelete(req.params.id)
      res.json({ "Success": "Property has been deleted", property: property });
  } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
  }
})

// Route 4 update the listings of the logged in user || logged in required
router.put('/updateproperty/:id', fetchuser, async (req, res) => {
    const { title, description, price,listing_type, location, status } = req.body;
    // const title = req.body
    // console.log(description);
    try {
        // Create a newProperty object
        const newProperty = {};

        if (title) { newProperty.title = title };
        if (description) { newProperty.description = description };
        if (location) { newProperty.location = location };
        if (price) { newProperty.price = price };
        if (listing_type) { newProperty.listing_type = listing_type };
        if (status) { newProperty.status = status };
        
        // Find the Property to be updated and update it
        let property = await Property.findById(req.params.id);
        if (!property) { return res.status(404).send("Not Found") }
        if (property.owner.toString() !== req.user.id) {
            return res.status(401).send("Not Allowed");
        }
        property = await Property.findByIdAndUpdate(req.params.id, { $set: newProperty }, { new: true })
        res.json({ property });
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
})

router.get('/fetchavailablelistings',fetchuser, async (req, res) => {
  const { type } = req.query;
  const userId = req.user.id; // Retrieve user ID from query parameters

  try {
    let query = { status: 'available', transacted: 'no' };

    if (type) {
      query.listing_type = type;
    }

    // Add the condition to filter out properties owned by the user
    query.owner = { $ne: userId };

    const properties = await Property.find(query);
    res.json(properties);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});







router.get('/fetchproperty/:id', fetchuser ,async (req, res) => {
  const userId = req.user.id; 
  try {
    if(!userId){
      return res.status(401).send("Not Allowed");
    }
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.json({ message: 'Property not found' });
    }
    res.json(property);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

const sign_function = (data, privateKey) => {
  privateKey = crypto.createPrivateKey({
      key: Buffer.from(privateKey, 'base64'),
      format: 'pem',
      type: 'pkcs8'
  });
  const signer = crypto.createSign('SHA256');
  signer.update(data);
  signer.end();

  const signature = signer.sign(privateKey, 'base64');
  return signature;
};

// Route 7: Book a property with signing
router.post('/bookproperty/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.json({ message: 'Property not found' });
    }

    // Fetch the buyer's private key based on their user ID (assumes you have implemented this logic)
    const buyerId = req.body.buyer; // Get the buyer's user ID from the request
    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.json({ message: 'Invalid buyer ID' });
    }

    // Check if a contract with the same buyer and property combination already exists
    const existingContract = await Contract.findOne({
      buyer: buyerId,
      property: property._id,
    });

    if (existingContract) {
      return res.json({ message: 'You have already booked this property' });
    }

    const buyer = await User.findById(buyerId);

    if (!buyer || !buyer.privateKey) {
      return res.json({ message: 'Buyer not found or private key missing' });
    }

    const buyerPrivateKey = buyer.privateKey; // Get the buyer's private key

    // Create the contract data
    const contractData = {
      seller: property.owner, // Set the seller to the property's owner
      buyer: buyerId, // Set the buyer based on your authentication or request data
      property: property._id, // Set the property to the booked property
      type: req.body.type, // Set the type (rent or buy) based on your form or request data
      terms: req.body.terms, // Set the contract terms based on your form or request data
    };

    // Use the private key to sign the contract data
    const signature = sign_function(JSON.stringify(contractData), buyerPrivateKey);

    // Include the contract data and the signature in the contract object
    const contract = new Contract({
      seller: contractData.seller,
      buyer: contractData.buyer,
      property: contractData.property,
      type: contractData.type,
      terms: contractData.terms,
      signature: signature,
    });

    // Save the signed contract to the database
    await contract.save();

    // You can perform additional actions, such as updating the property's status here
    res.json({ message: 'Property booked successfully', contract });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Route to report a property
router.post('/reportproperty/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { userId } = req.body;

    // Check if the property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Check if the user has already reported this property
    if (property.reports.includes(userId)) {
      return res.status(400).json({ error: 'You have already reported this property' });
    }

    // Add the user to the list of reports for this property
    property.reports.push(userId);
    await property.save();

    res.json({ message: 'Property reported successfully', property });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Route to get the report count for a property
router.get('/property/:propertyId/reportcount', async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Check if the property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const reportCount = property.reports.length;

    res.json({ reportCount });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

// routes/admin.js

// API to get all properties with more than 0 reports

// API to get all properties with reports
router.get('/reportedproperties', async (req, res) => {
  try {
    const reportedProperties = await Property.find({ reports: { $exists: true, $ne: [] } }, {
      _id: 1,
      title: 1,
      reports: 1,
    });
    res.json(reportedProperties);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});



module.exports = router;
