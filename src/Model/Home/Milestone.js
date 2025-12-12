 import mongoose from "mongoose";
import { SCHEMA } from "../../Utils/Constant.js";
 const HomeMilestoneSchema = new SCHEMA({
 Mstone:{
        type: String,
      required: true,
     
   },
    Year:{
        type: String,
      required: true,
     
   },
   Title:{
        type: String,
        required: true,
   },
    Desc:{
        type: String,
      required: true,
     
   },
   Img:{
    type: String,
      required: true,
   }
},
  { timestamps: true }

)


export const HomeMilestone = mongoose.model("HomeMilestone", HomeMilestoneSchema);
export default HomeMilestone;