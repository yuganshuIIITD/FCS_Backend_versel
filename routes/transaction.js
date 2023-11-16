const express = require('express');
const Transaction = require('../models/Transaction');
const router = express.Router();
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');
const Property = require('../models/Property');
const User = require('../models/Users');
const Contract = require('../models/Contract');

const JWT_SECRET = 'armoni@Yu';

// Route 1: create a new transaction - Login required
router.post('/newtransaction', async (req, res) => {
  try {
    const newOwner = req.body.userId;
    const propertyId = req.body.propertyId;
    const contractId = req.body.contractId

    console.log("new owner of the property",newOwner)
    console.log("property id in transaction",propertyId)
        let property = await Property.findById(propertyId);
        const newContract = {};
        newContract.status = 'completed'
        contract = await Contract.findByIdAndUpdate(contractId, { $set: newContract }, { new: true })
        const CurOwner=property.owner
        console.log("Current owner of property",CurOwner)
        if (property.status.toString() !== 'available') {
            console.log("asfsdfsdf");
            return res.status(401).send("Property not available");
        }
        const transaction = await Transaction.create({
            property: propertyId,
            prevowner: CurOwner,
            newowner: newOwner,
            amount: property.price,
            type:property.type
          });
        const newProperty = {};
        newProperty.owner=newOwner;
        newProperty.transacted = 'yes';
        if (!property) { return res.status(404).send("Not Found") }
        property = await Property.findByIdAndUpdate(propertyId, { $set: newProperty }, { new: true })
      res.send(transaction)
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  })

// Route 2: get all my transactions: Login required 
router.get('/gettransaction', fetchuser,  async (req, res) => {

  try {
    const transactions = await Transaction.find({$or: [{ prevowner: req.user.id }, { newowner: req.user.id }]});
    res.json(transactions);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
})

module.exports = router