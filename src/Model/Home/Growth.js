// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeGrowthSchema = new SCHEMA(
  {
   labels:{
        type: String,
      required: true,
     
   },
    Value:{
        type: String,
      required: true,
     
   },
   
  },
  { timestamps: true }
);

export const HomeGrowth = mongoose.model("HomeGrowth", HomeGrowthSchema);
export default HomeGrowth;
