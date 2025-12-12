// routes/catagory.routes.js
import express from "express";
import {
  createCatagory,
  getCatagory,
  updateCatagory,
  deleteCatagory,
} from "../../Controller/Product/Catagory.js"; // adjust path if needed

// Multer upload from your setup
import { upload } from "../../Middleware/Multer.js"; // adjust path to multer setup
import {authenticate }from "../../Middleware/AuthMiddleware.js"; // your auth middleware if any

const Catagoryrouter = express.Router();

// Use single-file upload middleware; field name is "Img"
const uploadMiddleware = upload.fields([{ name: "Img", maxCount: 1 }]);;

// Create: requires authenticate (if you need it) and upload
Catagoryrouter.post("/", authenticate, uploadMiddleware, createCatagory);

// List
Catagoryrouter.get("/", getCatagory);

// Update: accept optional image file
Catagoryrouter.patch("/:id", authenticate, uploadMiddleware, updateCatagory);

// Delete
Catagoryrouter.delete("/:id", authenticate, deleteCatagory);

export default Catagoryrouter;
