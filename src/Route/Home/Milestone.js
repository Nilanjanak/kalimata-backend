// routes/homemilestone.routes.js
import express from "express";
import {
  createHomeMilestone,
  listHomeMilestones,
  getHomeMilestone,
  updateHomeMilestone,
  deleteHomeMilestone,
} from "../../Controller/Home/Milestone.js"; // adjust path if needed

import { upload } from "../../Middleware/Multer.js"; // your multer setup
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth middleware

const HomeMilestoneRouter = express.Router();

// Use single-file upload middleware (field name "Img")
const uploadMiddleware = upload.single("Img");

// Create (Img required as file upload or Img URL in body)
HomeMilestoneRouter.post("/", authenticate, uploadMiddleware, createHomeMilestone);

// List / Latest
HomeMilestoneRouter.get("/", getHomeMilestone);      // returns all (or handle /latest below)
HomeMilestoneRouter.get("/latest", getHomeMilestone); // returns latest

// Get by id
HomeMilestoneRouter.get("/:id", getHomeMilestone);

// Update (optional image replacement)
HomeMilestoneRouter.patch("/:id", authenticate, uploadMiddleware, updateHomeMilestone);

// Delete
HomeMilestoneRouter.delete("/:id", authenticate, deleteHomeMilestone);

export default HomeMilestoneRouter;
