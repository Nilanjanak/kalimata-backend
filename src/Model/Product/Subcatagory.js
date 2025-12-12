// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const SubcatagorySchema = new SCHEMA(
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
   Catagory:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Catagory",
     
   },
  },
  { timestamps: true }
);

export const Subcatagory = mongoose.model("Subcatagory", SubcatagorySchema);
export default Subcatagory;
