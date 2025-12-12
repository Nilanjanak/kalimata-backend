import jwt from "jsonwebtoken";
import { User } from "../Model/User.js";



// Middleware: Authenticate user & attach user + role + permissions + organization
export const authenticate = async (req, res, next) => {
  try {

    // Cookies setup
    const token = req.cookies.AccessToken || req.headers.authorization?.split(' ')[1]; // handle both cookie and Authorization header
    if (!token) {
        return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Postman setup
    // const authHeader = req.headers["authorization"];
    // if (!authHeader || !authHeader.startsWith("Bearer ")) {
    //   return res.status(401).json({ error: "No token provided" });
    // }

    // const token = authHeader.split(" ")[1];
    console.log(token)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user with role + organization
    const user = await User.findById(decoded.id)
      


    if (!user) {
      return res.status(401).json({ error: "Invalid token: user not found" });
    }

    // Attach user details to req
  req.user = {
  id: user._id,
  email: user.email,
};

    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};




// export const requireRole = (roles) => {
//   return (req, res, next) => {
//     console.log(roles)
//     console.log(req.user.role)
//     console.log(roles.includes(req.user.role))
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({ message: "Forbidden: insufficient role" });
//     }
//     next();
//   };
// };
