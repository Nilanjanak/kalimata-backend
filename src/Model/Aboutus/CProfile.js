// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const CProfileSchema = new SCHEMA(
  {
  
      Img:{
        type: String,
      required: true,
     
   },
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

export const CProfile = mongoose.model("CProfile", CProfileSchema);
export default CProfile;
