// routes/mandv.routes.js
import express from "express";
import {
  createMandV,
  getMandV,
  updateMandV,
  deleteMandV,
} from "../../Controller/Aboutus/MAndV.js"; // adjust path if needed

import { upload } from "../../Middleware/Multer.js"; // adjust path to your multer setup
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth middleware

const MAndVRouter = express.Router();

// Use fields for Img1 and Img2
const uploadMiddleware = upload.fields([
  { name: "Img1", maxCount: 1 },
  { name: "Img2", maxCount: 1 },
]);

MAndVRouter.post("/", authenticate, uploadMiddleware, createMandV);

MAndVRouter.get("/", getMandV);
MAndVRouter.get("/:id", getMandV);
MAndVRouter.patch("/:id", authenticate, uploadMiddleware, updateMandV);
MAndVRouter.delete("/:id", authenticate, deleteMandV);

export default MAndVRouter;
