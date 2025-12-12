// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const ProductSchema = new SCHEMA(
  {
   Name:{
        type: String,
      required: true,
     
   },
     Dtext:{
        type: String,
      required: true,
     
   },
      Img1:{
        type: String,
      required: true,
     
   },
    Img2:{
        type: String,
      required: true,
     
   },
    Img3:{
        type: String,
      required: true,
     
   },
    CatagoryId:{
       type: mongoose.Schema.Types.ObjectId,
        ref: "Catagory",
     
   },
    SubcatagoryId:{
       type: mongoose.Schema.Types.ObjectId,
        ref: "Subcatagory",
     
   },   
   Cline1:{
        type: String,
      required: false,
     
   },
   Cline2:{
        type: String,
      required: false,
     
   },
   Cline3:{
        type: String,
      required: false,
     
   },
    Cline4:{
        type: String,
      required: false,
     
   },
    Cline5:{
        type: String,
      required: false,
     
   },
    Cline6:{
        type: String,
      required:false,
     
   },

   Tspec1:{
        type: String,
      required: false,
     
   },
   Tspec2:{
        type: String,
      required: false,
     
   },
   Tspec3:{
        type: String,
      required: false,
     
   },
   Tspec4:{
        type: String,
      required: false,
     
   },
   Tspec5:{
        type: String,
      required: false,
     
   },
   Tspec6:{
        type: String,
      required: false,
     
   },
    Tspec7:{
        type: String,
      required: false,
     
   },
   Tspec8:{
        type: String,
      required: false,
     
   },
   Tspec9:{
        type: String,
      required: false    
   },
   Tspec10:{
        type: String,
      required: false,
     
   },
   App1:{
     type: String,
      required: false,
   },
   App2:{
     type: String,
      required: false,
   },
   App3:{
     type: String,
      required: false,
   },
   App4:{
     type: String,
      required: false,
   },
    App5:{
     type: String,
      required: false,
   },
  App6:{
     type: String,
      required: false,
   },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", ProductSchema);
export default Product;
