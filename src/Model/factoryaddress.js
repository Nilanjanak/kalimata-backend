// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../Utils/Constant.js";

const FactaddressSchema = new SCHEMA(
  {
  Htext:{
      type: String,
      required: true,
  },
    Dtext:{
        type: String,
      required: true,
     
   }, 
   link:{
      type: String,
      required: true,
   } ,
    footerId:{
         type: mongoose.Schema.Types.ObjectId,
         ref: "Footer",
    }
  },
  { timestamps: true }
);

export const Factaddress = mongoose.model("Factaddress", FactaddressSchema);
export default Factaddress;
