const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    mobile:{
        type:Number,
        required:true,
        unique:true
    },
    password:{
        type: String,
        required:true
    },
    isAdmin:{
        type:Boolean,
        required:true
    }
},{timestamps:true});

module.exports = mongoose.model("admin", adminSchema);