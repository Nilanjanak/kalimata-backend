// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const CSRSchema = new SCHEMA(
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

export const CSR = mongoose.model("CSR", CSRSchema);
export default CSR;
