// routes/homemissionvision.routes.js
import express from "express";
import {
  createHomeMissionVisionandValue,
  getHomeMissionVisionandValueList,
  getHomeMissionVisionandValue,
  updateHomeMissionVisionandValue,
  deleteHomeMissionVisionandValue,
} from "../../Controller/Home/MAndVController.js";

import { upload } from "../../Middleware/Multer.js";
import { authenticate } from "../../Middleware/AuthMiddleware.js";

const router = express.Router();

const uploadMiddleware = upload.fields([
  { name: "Img1", maxCount: 1 },
  { name: "Img2", maxCount: 1 },
  { name: "Img3", maxCount: 1 },
]);

router.post("/", authenticate, uploadMiddleware, createHomeMissionVisionandValue);
router.get("/", getHomeMissionVisionandValueList);
router.get("/latest", getHomeMissionVisionandValue);
router.get("/:id", getHomeMissionVisionandValue);
router.patch("/:id", authenticate, uploadMiddleware, updateHomeMissionVisionandValue);
router.delete("/:id", authenticate, deleteHomeMissionVisionandValue);

export default router;
