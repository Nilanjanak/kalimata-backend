import express from "express";
import { authenticate } from "../Middleware/AuthMiddleware.js";
import { dashboardData, getCurrentUser, loginUser, logoutUser, registerUser, updateSelf } from "../Controller/User.js";

const UserRouter = express.Router();

// PUBLIC
UserRouter.post("/register", registerUser);
UserRouter.post("/login", loginUser);
UserRouter.post("/logout", logoutUser);

UserRouter.use(authenticate);

// LOGGED-IN USER 
UserRouter.get("/me", getCurrentUser);
UserRouter.patch("/me/update", updateSelf);
UserRouter.get("/dashboard", dashboardData);
 

export default UserRouter;
