// routes/homedirector.routes.js
import express from "express";
import {
  createHomeDirector,
  getHomeDirector,
  updateHomeDirector,
  deleteHomeDirector,
} from "../../Controller/Home/Directors.js"; // adjust path if needed

import { upload } from "../../Middleware/Multer.js"; // your multer setup
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth middleware

const HomeDirectorRouter = express.Router();

// Accept a single file upload field named "Vedios"
const uploadMiddleware = upload.single("Vedios");

// Create (video required as file or pass Vedios URL in body)
HomeDirectorRouter.post("/", authenticate, uploadMiddleware, createHomeDirector);

// Latest
HomeDirectorRouter.get("/", getHomeDirector);

// Get by id
HomeDirectorRouter.get("/:id", getHomeDirector);

// Update (optional video replacement)
HomeDirectorRouter.patch("/:id", authenticate, uploadMiddleware, updateHomeDirector);

// Delete
HomeDirectorRouter.delete("/:id", authenticate, deleteHomeDirector);

export default HomeDirectorRouter;
