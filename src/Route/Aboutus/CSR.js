// routes/csr.routes.js
import express from "express";
import {
  createCSR,
  getCSR,
  updateCSR,
  deleteCSR,
} from "../../Controller/Aboutus/CSR.js"; // adjust path if needed

import { upload } from "../../Middleware/Multer.js"; // adjust path to your multer setup
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth middleware

const CSRRouter = express.Router();

// Use single-file upload middleware (field name "Img")
const uploadMiddleware = upload.single("Img");

// Create
CSRRouter.post("/", authenticate, uploadMiddleware, createCSR);

// List


// Latest
CSRRouter.get("/", getCSR);

// Get by id
CSRRouter.get("/:id", getCSR);

// Update (optional image)
CSRRouter.patch("/:id", authenticate, uploadMiddleware, updateCSR);

// Delete
CSRRouter.delete("/:id", authenticate, deleteCSR);

export default CSRRouter;
