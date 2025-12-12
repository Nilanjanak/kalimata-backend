// models/Footer.js
import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";

const HomeServiceSchema = new SCHEMA(
  {
   Vedios:{
        type: String,
      required: true,
     
   },
  },
  { timestamps: true }
);

export const HomeService = mongoose.model("HomeService", HomeServiceSchema);
export default HomeService;
