// routes/footer.routes.js
import express from "express";
import { createFooter, getFooter, updateFooter } from "../Controller/Footer.js";
import { authenticate } from "../Middleware/AuthMiddleware.js";


const FooterRouter = express.Router();

// Create Footer
FooterRouter.post("/",authenticate, createFooter);

// Get Latest Footer
FooterRouter.get("/",getFooter);

// Update Footer
FooterRouter.patch("/:id",authenticate, updateFooter);

export default FooterRouter;
