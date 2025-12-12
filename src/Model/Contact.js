import mongoose from "mongoose";
import { SCHEMA } from "../Utils/Constant.js";

const ContactSchema = new SCHEMA(
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
    message: {
      type: String,
      require: true,
    },
  
  },{ timestamps: true }
);
export const Contact = mongoose.model("Contact", ContactSchema);