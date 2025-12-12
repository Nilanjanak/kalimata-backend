// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const BlogSchema = new SCHEMA(
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
    Adress:{
        type: String,
      required: true,
     
   }, 
    Adresslink:{
        type: String,
      required: true,
     
   },   
  },
  { timestamps: true }
);

export const Blog = mongoose.model("Blog", BlogSchema);
export default Blog;
