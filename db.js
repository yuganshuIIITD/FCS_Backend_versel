const mongoose = require('mongoose');
const mongooseURL = "mongodb+srv://arnav:56wp6HMY7vU3E1mm@cluster0.jykutjn.mongodb.net/?retryWrites=true&w=majority";

const connectToMongo = async () => {
  try {
    await mongoose.connect(mongooseURL, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Successfully connected to Mongo");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

module.exports = connectToMongo;


// 56wp6HMY7vU3E1mm