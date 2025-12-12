// Controller/HomeMilestoneController.js
import mongoose from "mongoose";
import HomeMilestone from "../../Model/Home/Milestone.js"; // adjust path if needed
import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // adjust path if needed

// helper to normalize values
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const requireFieldsForCreate = (body, hasFile) => {
  const missing = [];
  if (!norm(body.Mstone)) missing.push("Mstone");
  if (!norm(body.Year)) missing.push("Year");
  if (!norm(body.Title)) missing.push("Title");
  if (!norm(body.Desc)) missing.push("Desc");
  // Img required either as uploaded file or Img URL in body
  if (!hasFile && !norm(body.Img)) missing.push("Img");
  return missing;
};

// CREATE
export const createHomeMilestone = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // support upload.single('Img') or upload.fields([{name:'Img'}])
    const files = req.files || {};
    const fileFromFields = Array.isArray(files.Img) && files.Img.length ? files.Img[0] : undefined;
    const file = req.file || fileFromFields;

    const payload = {
      Mstone: norm(req.body.Mstone),
      Year: norm(req.body.Year),
      Title: norm(req.body.Title),
      Desc: norm(req.body.Desc),
      Img: undefined,
    };

    const missing = requireFieldsForCreate(req.body, !!file);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    // If there's an uploaded file, upload to Cloudinary
    if (file) {
      const uploadResult = await uploadOnCloudinary(file.path);
      if (!uploadResult) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Image upload failed." });
      }
      payload.Img = uploadResult.secure_url || uploadResult.url || "";
    } else if (norm(req.body.Img)) {
      payload.Img = norm(req.body.Img);
    }

    const doc = new HomeMilestone(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await HomeMilestone.findById(doc._id);
    return res.status(201).json({ success: true, message: "HomeMilestone created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeMilestone error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

// LIST (all)
export const listHomeMilestones = async (req, res) => {
  try {
    const items = await HomeMilestone.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("listHomeMilestones error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET single or latest
export const getHomeMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await HomeMilestone.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "HomeMilestone not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    // latest (route: /latest or GET / with path ending /latest)
    if (req.path && req.path.endsWith("/latest")) {
      const latest = await HomeMilestone.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No HomeMilestone found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await HomeMilestone.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getHomeMilestone error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE
export const updateHomeMilestone = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "HomeMilestone ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid HomeMilestone ID" });
    }

    const existing = await HomeMilestone.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeMilestone not found" });
    }

    const setPayload = {};
    const possible = ["Mstone", "Year", "Title", "Desc"];
    for (const k of possible) {
      if (typeof req.body[k] !== "undefined") {
        const v = norm(req.body[k]);
        if (!v) {
          if (session.inTransaction()) await session.abortTransaction();
          return res.status(400).json({ success: false, message: `${k} cannot be empty` });
        }
        setPayload[k] = v;
      }
    }

    // files support (Img)
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
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Img cannot be empty" });
      }
      setPayload.Img = v;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await HomeMilestone.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeMilestone updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeMilestone error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

// DELETE
export const deleteHomeMilestone = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "HomeMilestone ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid HomeMilestone ID" });
    }

    const existing = await HomeMilestone.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeMilestone not found" });
    }

    await HomeMilestone.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeMilestone deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeMilestone error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
