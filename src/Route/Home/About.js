// routes/homeabout.routes.js
import express from "express";
import {
  createHomeAbout,

  getHomeAbout,
  updateHomeAbout,
  deleteHomeAbout,
} from "../../Controller/Home/About.js"; // adjust path

import { upload } from "../../Middleware/Multer.js"; // adjust path
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth

const HomeAboutrouter = express.Router();

// Accept three image uploads (Img1, Img2, Img3)
const uploadMiddleware = upload.fields([
  { name: "Img1", maxCount: 1 },
  { name: "Img2", maxCount: 1 },
  { name: "Img3", maxCount: 1 },
]);

// Create
HomeAboutrouter.post("/", authenticate, uploadMiddleware, createHomeAbout);


// Latest
HomeAboutrouter.get("/", getHomeAbout);

// Get by id
HomeAboutrouter.get("/:id", getHomeAbout);

// Update (optional images)
HomeAboutrouter.patch("/:id", authenticate, uploadMiddleware, updateHomeAbout);

// Delete
HomeAboutrouter.delete("/:id", authenticate, deleteHomeAbout);

export default HomeAboutrouter;
