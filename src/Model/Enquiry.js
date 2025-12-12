import mongoose from "mongoose";
import { SCHEMA } from "../Utils/Constant.js";

const EnquirySchema = new SCHEMA(
  {
   
    name: {
      type: String,
      required: true,
    },
    email:{
    type: String,
      require: true,
    },
    phone:{
        type: String,
      require: true,
    },
    enquirie: {
      type: String,
      require: true,
    },
  
  },{ timestamps: true }
);
export const Enquiry = mongoose.model("Enquiry", EnquirySchema);
