// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeBannerSchema = new SCHEMA(
  {
   Vedios1:{
        type: String,
      required: true,
     
   },
    Vedios2:{
        type: String,
      required: true,
     
   },
    Vedios3:{
        type: String,
      required: true,
     
   },
    Htext:{
        type: String,
      required: true,
     
   },
    Bp1:{
        type: String,
      required: true,
     
   }, 
   Bp2:{
        type: String,
      required: true,
     
   }, 
    Bp3:{
        type: String,
      required: true,
     
   }, 
  },
  { timestamps: true }
);

export const HomeBanner = mongoose.model("HomeBanner", HomeBannerSchema);
export default HomeBanner;
