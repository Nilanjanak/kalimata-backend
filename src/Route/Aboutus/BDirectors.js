// routes/bdirector.routes.js
import express from "express";
import {
  createBdirector,

  getBdirector,
  updateBdirector,
  deleteBdirector,
} from "../../Controller/Aboutus/BDirectors.js"; // adjust path

import { upload } from "../../Middleware/Multer.js"; // adjust path to your multer setup
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth

const BDirectorRouter = express.Router();

// support file uploads for Img1/Img2/Img3
const uploadMiddleware = upload.fields([
  { name: "Img1", maxCount: 1 },
  { name: "Img2", maxCount: 1 },
  { name: "Img3", maxCount: 1 },
]);

BDirectorRouter.post("/", authenticate, uploadMiddleware, createBdirector);
BDirectorRouter.get("/", getBdirector);
BDirectorRouter.get("/:id", getBdirector);
BDirectorRouter.patch("/:id", authenticate, uploadMiddleware, updateBdirector);
BDirectorRouter.delete("/:id", authenticate, deleteBdirector);

export default BDirectorRouter;
