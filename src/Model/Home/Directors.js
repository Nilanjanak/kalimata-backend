// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeDirectorSchema = new SCHEMA(
  {
   Title:{
        type: String,
      required: true,
     
   },
    Text:{
        type: String,
      required: true,
     
   },
    Vedios:{
        type: String,
      required: true,
     
   },
  },
  { timestamps: true }
);

export const HomeDirector = mongoose.model("HomeDirector", HomeDirectorSchema);
export default HomeDirector;
