// Server/src/Router/HomeBanner.js
import express from "express";
import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional protection
import { upload } from "../../Middleware/Multer.js"; // your multer instance

import {
  createHomeBanner,
  getAllHomeBanners,
  updateHomeBanner,
  deleteHomeBanner,
} from "../../Controller/Home/Banner.js"; // adjust path if needed

const HomeBannerRouter = express.Router();

// Multer fields mapping to Vedios1..Vedios3 file inputs
const uploadMiddleware = upload.fields([
  { name: "Vedios1", maxCount: 1 },
  { name: "Vedios2", maxCount: 1 },
  { name: "Vedios3", maxCount: 1 },
]);

// Create (protected)
HomeBannerRouter.post("/", authenticate, uploadMiddleware, createHomeBanner);

// Read all
HomeBannerRouter.get("/", getAllHomeBanners);

// Read single
// router.get("/:id", getHomeBannerById);

// Update (protected)
HomeBannerRouter.route("/:id").patch( authenticate, uploadMiddleware, updateHomeBanner)
.delete(authenticate, deleteHomeBanner);

export default HomeBannerRouter;
