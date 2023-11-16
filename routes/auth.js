const express = require('express');
const User = require('../models/Users');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser');

const JWT_SECRET = 'armoni@Yu';


// ROUTE 1: Create a User using: POST "/api/auth/createuser". No login required
router.post('/createuser', [
    body('name', 'Name must be atleast 3 characters').isLength({ min: 3 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', 'Password must be atleast 5 characters').isLength({ min: 5 }),
    body('mobile','Enter a valid mobile number').isLength({ min: 10, max: 10 }),
  ], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      // Check whether the user with this email exists already

      const adminWithEmail = await Admin.findOne({ email: req.body.email });
      if (adminWithEmail) {
        return res.json({ success: false, error: "Email is already registered as an admin" });
      }
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res.json({ success: false, error: "Sorry a user with this email already exists" })
      }
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);
  
      // Create a new user
      user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email,
        mobile: req.body.mobile
      });
      const data = {
        user: {
          id: user.id,
          role: 'user',
        }
      }
      const authtoken = jwt.sign(data, JWT_SECRET);
  
      res.json({ success: true, authtoken });
  
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  })
  
  // ROUTE 2: Authenticate a User using: POST "/api/auth/login". No login required 
  // ROUTE 2: Authenticate a User or Admin using: POST "/api/auth/login". No login required 
router.post('/login', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password cannot be blank').exists(),
], async (req, res) => {
  // If there are errors, return Bad request and the errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    // Try to find the user in the User model
    let user = await User.findOne({ email });
    let role = 'user'; // Default role is user

    // If the user is not found in the User model, try finding in the Admin model
    if (!user) {
      user = await Admin.findOne({ email });
      role = 'admin';
    }

    if (!user) {
      return res.json({ success: false, error: "Please try to login with correct credentials" });
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      return res.json({ success: false, error: "Please try to login with correct credentials" });
    }

    const data = {
      user: {
        id: user.id,
        role: role,
      }
    };
    const authtoken = jwt.sign(data, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

    res.json({ success: true, authtoken });

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

  
  
  // ROUTE 3: Get loggedin User Details using: POST "/api/auth/getuser". Login required
  router.get('/getuser', fetchuser, async (req, res) => {
    console.log("helllloooo")
    try {
      const userId = req.user.id; 
      const user = await User.findById(userId).select('-password');
  
      if (!user) {
        return res.json({ message: 'User not found' });
      }
  
      res.json(user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  });
  module.exports = router

  // ROUTE 4: Get user name using id and using: GET "/api/auth/getuser". Login required
  router.get('/getuser/:id', fetchuser, async (req, res) => {
    try {
      const userId = req.user.id; 
      if(!userId){
        return res.status(401).send("Not Allowed");
      }
      const user = await User.findById(req.params.id).select('name');
      if (!user) {
        return res.json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Internal Server Error');
    }
  });
  module.exports = router

    // ROUTE 4: Get user name using id and using: GET "/api/auth/getuser". Login required
    router.get('/getuser/:id', fetchuser, async (req, res) => {
      try {
        const userId = req.user.id; 
        if(!userId){
          return res.status(401).send("Not Allowed");
        }
        const user = await User.findById(req.params.id).select('name');
        if (!user) {
          return res.json({ message: 'User not found' });
        }
        
        res.json(user);
      } catch (error) {
        console.error(error.message);
        res.status(500).send('Internal Server Error');
      }
    });
    module.exports = router

router.post('/createadmin', [
  body('username', 'Username must be at least 3 characters').isLength({ min: 3 }),
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password must be at least 5 characters').isLength({ min: 5 }),
  body('mobile', 'Enter a valid mobile number').isLength({ min: 10, max: 10 }),
  body('isAdmin', 'isAdmin must be a boolean').isBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check whether the admin with this email exists already
    const userWithEmail = await User.findOne({ email: req.body.email });
    if (userWithEmail) {
      return res.status(400).json({ error: "Email is already registered as a user" });
    }
    let admin = await Admin.findOne({ email: req.body.email });
    if (admin) {
      return res.status(400).json({ error: "Sorry an admin with this email already exists" })
    }

    const salt = await bcrypt.genSalt(10);
    const secPass = await bcrypt.hash(req.body.password, salt);

    // Create a new admin
    admin = await Admin.create({
      username: req.body.username,
      password: secPass,
      email: req.body.email,
      mobile: req.body.mobile,
      isAdmin: req.body.isAdmin,
    });

    const data = {
      user: {
        id: admin.id,
        
      }
    }
    const authtoken = jwt.sign(data, JWT_SECRET);

    res.json({ authtoken })

  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ROUTE 5: Authenticate an Admin using: POST "/api/auth/adminlogin". No login required


router.get('/allusers', async (req, res) => {
  try {
    const users = await User.find({}, { _id: 0, __v: 0, password: 0, privateKey: 0 });
    res.json(users);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
