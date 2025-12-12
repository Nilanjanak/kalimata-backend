// Controller/CSRController.js
import mongoose from "mongoose";
import CSR from "../../Model/Aboutus/CSR.js"; // adjust path if needed
import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // adjust path if needed

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
  // Img handled separately (file upload or direct URL)
  return missing;
};

export const createCSR = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // support upload.single('Img') or upload.fields([{name:'Img'}])
    const files = req.files || {};
    const fileFromFields = Array.isArray(files.Img) && files.Img.length ? files.Img[0] : undefined;
    const file = req.file || fileFromFields;

    const payload = {
      Img: undefined,
      Htext: norm(req.body.Htext),
      Dtext: norm(req.body.Dtext),
    };

    const missing = requireFieldsForCreate(req.body);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    // require image on create
    if (!file && !req.body.Img) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img file is required." });
    }

    // if uploaded file present -> upload to Cloudinary
    if (file) {
      const uploadResult = await uploadOnCloudinary(file.path);
      if (!uploadResult) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Image upload failed." });
      }
      payload.Img = uploadResult.secure_url || uploadResult.url || "";
    } else if (req.body.Img) {
      payload.Img = norm(req.body.Img);
    }

    const doc = new CSR(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await CSR.findById(doc._id);
    return res.status(201).json({ success: true, message: "CSR created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createCSR error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const listCSRs = async (req, res) => {
  try {
    const items = await CSR.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("listCSRs error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getCSR = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await CSR.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "CSR not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    // latest support if route called as /latest
    if (req.path && req.path.endsWith("/latest")) {
      const latest = await CSR.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No CSR found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await CSR.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getCSR error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCSR = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "CSR ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid CSR ID" });
    }

    const existing = await CSR.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "CSR not found" });
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

    // support upload.single('Img') or upload.fields([{name:'Img'}])
    const files = req.files || {};
    const fileFromFields = Array.isArray(files.Img) && files.Img.length ? files.Img[0] : undefined;
    const file = req.file || fileFromFields;

    if (file) {
      const uploadResult = await uploadOnCloudinary(file.path);
      if (!uploadResult) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Image upload failed." });
      }
      setPayload.Img = uploadResult.secure_url || uploadResult.url || "";
    } else if (typeof req.body.Img !== "undefined") {
      const v = norm(req.body.Img);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Img cannot be empty" }); }
      setPayload.Img = v;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await CSR.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "CSR updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateCSR error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteCSR = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "CSR ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid CSR ID" });
    }

    const existing = await CSR.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "CSR not found" });
    }

    await CSR.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "CSR deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteCSR error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
