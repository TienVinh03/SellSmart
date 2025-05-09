// Nhà cung cấp
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ProviderSchema = new Schema(
  {
    fullName:{
        type:String,
        required:true,
        trim:true
    },
    phoneNumber:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    address:{
        type:String,
        required:true
    },
    status:{
        type:String,
        enum:['cung cấp','dừng cung cấp'],
        default:'cung cấp'
    }
  },
  { timestamps:true },
);

module.exports = mongoose.model("Provider", ProviderSchema,'providers');