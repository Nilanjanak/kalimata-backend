// Controller/OurvalueController.js
import mongoose from "mongoose";
import Ourvalue from "../../Model/Blog/Ourvalue.js"; // adjust path if needed

// helpers
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const requireFieldsForCreate = (body) => {
  const missing = [];
  if (!norm(body.Htext)) missing.push("Htext");
  if (!norm(body.Dtext)) missing.push("Dtext");
  return missing;
};

export const createOurvalue = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const payload = {
      Htext: norm(req.body.Htext),
      Dtext: norm(req.body.Dtext),
    };

    const missing = requireFieldsForCreate(req.body);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    const item = new Ourvalue(payload);
    await item.save({ session });

    await session.commitTransaction();

    const result = await Ourvalue.findById(item._id);
    return res.status(201).json({ success: true, message: "Ourvalue created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createOurvalue error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};



export const getOurvalue = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await Ourvalue.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "Ourvalue not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    // latest route support if called as /latest
    if (req.path && req.path.endsWith("/latest")) {
      const latest = await Ourvalue.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No ourvalue found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await Ourvalue.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getOurvalue error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateOurvalue = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Ourvalue ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await Ourvalue.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Ourvalue not found" });
    }

    const setPayload = {};
    if (typeof req.body.Htext !== "undefined") {
      const v = norm(req.body.Htext);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Htext cannot be empty" }); }
      setPayload.Htext = v;
    }
    if (typeof req.body.Dtext !== "undefined") {
      const v = norm(req.body.Dtext);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Dtext cannot be empty" }); }
      setPayload.Dtext = v;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await Ourvalue.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Ourvalue updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateOurvalue error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteOurvalue = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Ourvalue ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await Ourvalue.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Ourvalue not found" });
    }

    await Ourvalue.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Ourvalue deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteOurvalue error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
