// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const OurvalueSchema = new SCHEMA(
  {
  
    
      Htext:{
        type: String,
      required: true,
     
   },
      Dtext:{
        type: String,
      required: true,
     
   }, 
     
  },
  { timestamps: true }
);

export const Ourvalue = mongoose.model("Ourvalue", OurvalueSchema);
export default Ourvalue;
