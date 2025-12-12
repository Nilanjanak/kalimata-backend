// routes/ourvalue.routes.js
import express from "express";
import {
  createOurvalue,

  getOurvalue,
  updateOurvalue,
  deleteOurvalue,
} from "../../Controller/Blog/OurValue.js"; // adjust path if needed

import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth

const OurValueRouter = express.Router();

OurValueRouter.post("/", authenticate, createOurvalue);
OurValueRouter.get("/", getOurvalue);
OurValueRouter.get("/:id", getOurvalue);
OurValueRouter.patch("/:id", authenticate, updateOurvalue);
OurValueRouter.delete("/:id", authenticate, deleteOurvalue);

export default OurValueRouter;
