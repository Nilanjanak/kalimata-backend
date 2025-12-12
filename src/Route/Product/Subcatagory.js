// routes/subcatagory.routes.js
import express from "express";
import {
  createSubcatagory,
  getSubcatagory,
  updateSubcatagory,
  deleteSubcatagory,
} from "../../Controller/Product/Subcatagory.js"; // adjust path

import { upload } from "../../Middleware/Multer.js"; // your multer setup
import {authenticate} from "../../Middleware/AuthMiddleware.js"; // optional auth middleware

const SubCatagoryRouter = express.Router();

// Use single-file upload; field name is "Img"
const uploadMiddleware = upload.fields([{ name: "Img", maxCount: 1 }]);;

// Create
SubCatagoryRouter.post("/", authenticate, uploadMiddleware, createSubcatagory);

// List
SubCatagoryRouter.get("/", getSubcatagory);

// Latest


// Get by id
SubCatagoryRouter.get("/:id", getSubcatagory);

// Update (optional image)
SubCatagoryRouter.patch("/:id", authenticate, uploadMiddleware, updateSubcatagory);

// Delete
SubCatagoryRouter.delete("/:id", authenticate, deleteSubcatagory);

export default SubCatagoryRouter;
