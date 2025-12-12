// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeMissionVisionandValueSchema = new SCHEMA(
  {
   Htext1:{
        type: String,
      required: true,
     
   },
   Htext2:{
        type: String,
      required: true,
     
   },
   Htext3:{
        type: String,
      required: true,
     
   },
    Dtext1:{
        type: String,
      required: true,
     
   }, 
   Dtext2:{
        type: String,
      required: true,
     
   },
   Dtext3:{
        type: String,
      required: true,
     
   },
   Img1:{
        type: String,
      required: false,
     
   },  
   Img2:{
        type: String,
      required: false,
     
   }, 
   Img3:{
        type: String,
      required: false,
     
   }, 
  },
  { timestamps: true }
);

export const HomeMissionVisionandValue = mongoose.model("HomeMissionVisionandValue", HomeMissionVisionandValueSchema);
export default HomeMissionVisionandValue;
