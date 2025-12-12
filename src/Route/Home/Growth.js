// routes/homegrowth.routes.js
import express from "express";
import {
  createHomeGrowth,
  listHomeGrowth,
  getHomeGrowth,
  updateHomeGrowth,
  deleteHomeGrowth,
} from "../../Controller/Home/Growth.js"; // adjust path if needed

import { authenticate } from "../../Middleware/AuthMiddleware.js"; // optional auth

const HomeGrowthRouter = express.Router();

HomeGrowthRouter.post("/", authenticate, createHomeGrowth);

HomeGrowthRouter.get("/", getHomeGrowth);
HomeGrowthRouter.get("/:id", getHomeGrowth);
HomeGrowthRouter.patch("/:id", authenticate, updateHomeGrowth);
HomeGrowthRouter.delete("/:id", authenticate, deleteHomeGrowth);

export default HomeGrowthRouter;
