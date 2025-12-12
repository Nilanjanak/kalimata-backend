// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const CatagorySchema = new SCHEMA(
  {
   Name:{
        type: String,
      required: true,
     
   },
     Dtext:{
        type: String,
      required: true,
     
   },
      Img:{
        type: String,
      required: true,
     
   },
      KeyP1:{
        type: String,
      required: true,
     
   },
      KeyP2:{
        type: String,
      required: true,
     
   },   
   KeyP3:{
        type: String,
      required: true,
     
   },
  },
  { timestamps: true }
);

export const Catagory = mongoose.model("Catagory", CatagorySchema);
export default Catagory;
