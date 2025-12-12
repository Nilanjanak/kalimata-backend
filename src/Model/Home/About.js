// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeAboutSchema = new SCHEMA(
  {
   Num1:{
        type: String,
      required: true,
     
   },
    Num2:{
        type: String,
      required: true,
     
   },
    Num3:{
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
  },
  { timestamps: true }
);

export const HomeAbout = mongoose.model("HomeAbout", HomeAboutSchema);
export default HomeAbout;
