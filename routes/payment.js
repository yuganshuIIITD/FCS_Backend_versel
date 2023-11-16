const express = require("express");
const router = express.Router();
const Property = require("../models/Property");
var fetchuser = require("../middleware/fetchuser");

const Stripe = require("stripe");
const Contract = require("../models/Contract");
const stripe = Stripe(
  "sk_test_51OCPYhSBb3uJVSHxRyOLljTf8z4jcKjSGQQhbPvQOy1twvl9gX72SxYFoUHqoECf9UDvF7CJm4NJkysW8XQx9dLB00VYeYnEaY"
);
router.post("/newpayment", async (req, res) => {
  const referer = req.get("Referer");

  // Default success and cancel URLs
  let successUrl = "http://localhost:5173/user/checkoutSuccess";
  let cancelUrl = "http://localhost:5173/user/checkoutFail";

  if (referer) {
    // Use the referer as the base URL for the success and cancel URLs
    const url = new URL(referer);
    const frontendUrl = `${url.protocol}//${url.host}`;
    successUrl = `${frontendUrl}/user/checkoutSuccess`;
    cancelUrl = `${frontendUrl}/user/checkoutFail`;
  } else {
    console.error(
      "Referer header not present in the request. Using default URLs."
    );
  }

  try {
    // Find the contract using the contractId from the request body
    const contract = await Contract.findById(req.body.contractId);

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Extract propertyId from the contract
    const propertyId = contract.property;

    // Find the property using the propertyId
    const property = await Property.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // Modify the success_url in your API
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: property.title,
              description: property.description,
            },
            unit_amount: property.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${successUrl}?propertyId=${property._id}&contractId=${contract._id}`,
      cancel_url: cancelUrl,
    });

    console.log("Session created");
    res.json({
      url: session.url,
      propertyId: property._id,
      contractId: contract._id,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

module.exports = router;
