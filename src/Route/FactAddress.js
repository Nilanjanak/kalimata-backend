// routes/factaddress.routes.js
import express from "express";
import {
  createFactaddress,
  updateFactaddress,
  getFactaddress,
  deleteFactaddress,
} from "../Controller/FactAddress.js"; // adjust path if needed


const FactAddrouter = express.Router();

FactAddrouter.post("/", createFactaddress);
FactAddrouter.get("/", getFactaddress);
FactAddrouter.patch("/:id", updateFactaddress);
FactAddrouter.delete("/:id", deleteFactaddress);

export default FactAddrouter;
