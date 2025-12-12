// routes/cprofile.routes.js
import express from "express";
import {
  createCProfile,
  getCProfile,
  updateCProfile,
  deleteCProfile,
} from "../../Controller/Aboutus/Cprofile.js"; // adjust path if needed

import { upload } from "../../Middleware/Multer.js"; // your multer setup
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth middleware

const CProfileRouter = express.Router();

// Use single-file upload middleware (field name "Img")
const uploadMiddleware = upload.single("Img");

// Create
CProfileRouter.post("/", authenticate, uploadMiddleware, createCProfile);

// Latest
CProfileRouter.get("/", getCProfile);

// Get by id
CProfileRouter.get("/:id", getCProfile);

// Update (optional image)
CProfileRouter.patch("/:id", authenticate, uploadMiddleware, updateCProfile);

// Delete
CProfileRouter.delete("/:id", authenticate, deleteCProfile);

export default CProfileRouter;
