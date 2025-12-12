// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const BdirectorSchema = new SCHEMA(
  {
  
      Img1:{
        type: String,
      required: true,
     
   },
    Desig1:{
        type: String,
      required: true,
     
   },
      Dtext1:{
        type: String,
      required: true,
     
   }, 
    Name1:{
        type: String,
      required: true,
     
   },  
    Img2:{
        type: String,
      required: true,
     
   },
    Desig2:{
        type: String,
      required: true,
     
   },
      Dtext2:{
        type: String,
      required: true,
     
   }, 
    Name2:{
        type: String,
      required: true,
     
   },  
   
      Img3:{
        type: String,
      required: true,
     
   },
    Desig3:{
        type: String,
      required: true,
     
   },
      Dtext3:{
        type: String,
      required: true,
     
   }, 
    Name3:{
        type: String,
      required: true,
     
   },  
  },
  { timestamps: true }
);

export const Bdirector = mongoose.model("Bdirector", BdirectorSchema);
export default Bdirector;
