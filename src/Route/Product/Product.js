// routes/product.routes.js
import express from "express";
import {
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../../Controller/Product/Product.js"; // adjust path

import { upload } from "../../Middleware/Multer.js"; // your multer setup
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth middleware

const ProductRouter = express.Router();

// files: Img1, Img2, Img3
const uploadMiddleware = upload.fields([
  { name: "Img1", maxCount: 1 },
  { name: "Img2", maxCount: 1 },
  { name: "Img3", maxCount: 1 },
]);

// Create
ProductRouter.post("/", authenticate, uploadMiddleware, createProduct);

// List
ProductRouter.get("/", getProduct);

// Latest
ProductRouter.get("/:id", getProduct);



// Update (optional images)
ProductRouter.patch("/:id", authenticate, uploadMiddleware, updateProduct);

// Delete
ProductRouter.delete("/:id", authenticate, deleteProduct);

export default ProductRouter;
