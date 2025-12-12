// routes/blog.routes.js
import express from "express";
import {
  createBlog,

  getBlog,
  updateBlog,
  deleteBlog,
} from "../../Controller/Blog/Blog.js"; // adjust path

import { upload } from "../../Middleware/Multer.js"; // adjust path to your multer setup
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth middleware

const BlogRouter = express.Router();

// Accept single file "Img" (simpler) or you can use fields([{name:'Img', maxCount:1}])
const uploadMiddleware = upload.single("Img");

// Create
BlogRouter.post("/", authenticate, uploadMiddleware, createBlog);

// List


// Latest
BlogRouter.get("/", getBlog);

// Get by id


// Update (optional image)
BlogRouter.patch("/:id", authenticate, uploadMiddleware, updateBlog);

// Delete
BlogRouter.delete("/:id", authenticate, deleteBlog);

export default BlogRouter;
