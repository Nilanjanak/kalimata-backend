// server/server.js

import os from "os";
import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";

import DB_Connection from "./src/Db/Db.js";

import UserRouter from "./src/Route/User.js";
import EnquiryRouter from "./src/Route/Enquiry.js";
import ContactRouter from "./src/Route/Contact.js";
import FooterRouter from "./src/Route/Footer.js";
import FactAddRouter from "./src/Route/FactAddress.js";

import Catagoryrouter from "./src/Route/Product/Catagory.js";
import SubCatagoryRouter from "./src/Route/Product/Subcatagory.js";
import ProductRouter from "./src/Route/Product/Product.js";

import BlogRouter from "./src/Route/Blog/Blog.js";
import OurValueRouter from "./src/Route/Blog/OurValue.js";

import BDirectorRouter from "./src/Route/Aboutus/BDirectors.js";
import CProfileRouter from "./src/Route/Aboutus/CProfile.js";
import CSRRouter from "./src/Route/Aboutus/CSR.js";
import MAndVRouter from "./src/Route/Aboutus/MAndV.js";

import HomeAboutrouter from "./src/Route/Home/About.js";
import HomeBannerRouter from "./src/Route/Home/Banner.js";
import HomeDirectorRouter from "./src/Route/Home/Directors.js";
import HomeGrowthRouter from "./src/Route/Home/Growth.js";
import HomeMilestoneRouter from "./src/Route/Home/Milestone.js";

/* -------------------------------------------------------
   ENV SETUP
------------------------------------------------------- */
dotenv.config();

const app = express();
const PORT = process.env.PORT || 7000;

/* -------------------------------------------------------
   TRUST PROXY (REQUIRED FOR RENDER + COOKIES)
------------------------------------------------------- */
app.set("trust proxy", 1);

/* -------------------------------------------------------
   GET LOCAL NETWORK IP (DEV DEBUGGING ONLY)
------------------------------------------------------- */
function getLocalIP() {
  try {
    const nets = os.networkInterfaces();
    for (const name in nets) {
      for (const iface of nets[name]) {
        if (
          (iface.family === "IPv4" || iface.family === 4) &&
          !iface.internal
        ) {
          return iface.address;
        }
      }
    }
  } catch (err) {
    console.warn("Local IP error:", err);
  }
  return "127.0.0.1";
}

const localIP = getLocalIP();

/* -------------------------------------------------------
   SECURITY & PERFORMANCE MIDDLEWARE
------------------------------------------------------- */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cookieParser());

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

/* -------------------------------------------------------
   CORS CONFIGURATION (CRITICAL)
------------------------------------------------------- */
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:8080",
  "http://localhost:8086",
  `http://${localIP}:5173`,
  `http://${localIP}:5174`,
  `http://${localIP}:8080`,
  `http://${localIP}:8086`,
]);

// Production frontend origin (NO PATH!)
if (process.env.FRONTEND_URL) {
  try {
    const url = new URL(process.env.FRONTEND_URL);
    allowedOrigins.add(url.origin);
    console.log("🌐 Added production origin:", url.origin);
  } catch {
    allowedOrigins.add(process.env.FRONTEND_URL);
    console.log("🌐 Added production origin (raw):", process.env.FRONTEND_URL);
  }
}

console.log("🌐 Allowed CORS Origins:", Array.from(allowedOrigins));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman / curl

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      console.warn("❌ Blocked CORS Origin:", origin);
      return callback(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  })
);

/* -------------------------------------------------------
   HEALTH CHECK
------------------------------------------------------- */
app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "production",
  });
});

/* -------------------------------------------------------
   API ROUTES
------------------------------------------------------- */
app.use("/api/v1/user", UserRouter);
app.use("/api/v1/enquiry", EnquiryRouter);
app.use("/api/v1/contact", ContactRouter);
app.use("/api/v1/footer", FooterRouter);
app.use("/api/v1/factAdd", FactAddRouter);

app.use("/api/v1/product/catagory", Catagoryrouter);
app.use("/api/v1/product/subcatagory", SubCatagoryRouter);
app.use("/api/v1/product", ProductRouter);

app.use("/api/v1/blog", BlogRouter);
app.use("/api/v1/blog/ourvalue", OurValueRouter);

app.use("/api/v1/about/bdirector", BDirectorRouter);
app.use("/api/v1/about/cprofile", CProfileRouter);
app.use("/api/v1/about/csr", CSRRouter);
app.use("/api/v1/about/mandv", MAndVRouter);

app.use("/api/v1/home/about", HomeAboutrouter);
app.use("/api/v1/home/banner", HomeBannerRouter);
app.use("/api/v1/home/director", HomeDirectorRouter);
app.use("/api/v1/home/growth", HomeGrowthRouter);
app.use("/api/v1/home/milestone", HomeMilestoneRouter);

/* -------------------------------------------------------
   API 404 HANDLER
------------------------------------------------------- */
app.use("/api", (req, res) => {
  res.status(404).json({ error: "API route not found" });
});

/* -------------------------------------------------------
   GLOBAL ERROR HANDLER
------------------------------------------------------- */
app.use((err, req, res, next) => {
  console.error("🔥 Unhandled Error:", err?.stack || err);
  res.status(500).json({
    error: err?.message || "Internal server error",
  });
});

/* -------------------------------------------------------
   START SERVER AFTER DB CONNECTION
------------------------------------------------------- */
DB_Connection(process.env.DB_URI, process.env.DB_NAME)
  .then(() => {
    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () => {
      console.log("\n🚀 Server Started");
      console.log(`   ➤ Port: ${PORT}`);
      console.log(`   ➤ Local: http://localhost:${PORT}`);
      console.log(`   ➤ LAN:   http://${localIP}:${PORT}`);

      if (process.env.NODE_ENV === "production") {
        console.log(
          `   ➤ Render: ${process.env.RENDER_EXTERNAL_URL || "N/A"}`
        );
      }
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });
