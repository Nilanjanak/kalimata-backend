// Controller/HomeDirectorController.js
import mongoose from "mongoose";
import HomeDirector from "../../Model/Home/Directors.js"; // adjust path if needed
import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // adjust path if needed

// helper to normalize values
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const requireFieldsForCreate = (body, hasFile) => {
  const missing = [];
  if (!norm(body.Title)) missing.push("Title");
  if (!norm(body.Text)) missing.push("Text");
  // Vedios: require either file upload (hasFile === true) or body.Vedios URL
  if (!hasFile && !norm(body.Vedios)) missing.push("Vedios");
  return missing;
};

// CREATE
export const createHomeDirector = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // support upload.single('Vedios') or upload.fields([{name:'Vedios'}])
    const files = req.files || {};
    const fileFromFields = Array.isArray(files.Vedios) && files.Vedios.length ? files.Vedios[0] : undefined;
    const file = req.file || fileFromFields;

    const payload = {
      Title: norm(req.body.Title),
      Text: norm(req.body.Text),
      Vedios: undefined, // will set from upload or body
    };

    const missing = requireFieldsForCreate(req.body, !!file);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    // If file provided -> upload to Cloudinary (uploadOnCloudinary uses resource_type: "auto")
    if (file) {
      const uploadResult = await uploadOnCloudinary(file.path);
      if (!uploadResult) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Video upload failed." });
      }
      // choose secure_url if present
      payload.Vedios = uploadResult.secure_url || uploadResult.url || "";
    } else if (norm(req.body.Vedios)) {
      // accept direct URL
      payload.Vedios = norm(req.body.Vedios);
    }

    const doc = new HomeDirector(payload);
    await doc.save({ session });

    await session.commitTransaction();
    const result = await HomeDirector.findById(doc._id);
    return res.status(201).json({ success: true, message: "HomeDirector created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeDirector error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

// LIST
// export const listHomeDirectors = async (req, res) => {
//   try {
//     const items = await HomeDirector.find({}).sort({ createdAt: -1 });
//     return res.status(200).json({ success: true, data: items });
//   } catch (err) {
//     console.error("listHomeDirectors error:", err);
//     return res.status(500).json({ success: false, message: err.message });
//   }
// };

// GET single or latest
export const getHomeDirector = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await HomeDirector.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "HomeDirector not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    // latest
    if (req.path && req.path.endsWith("/latest")) {
      const latest = await HomeDirector.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No HomeDirector found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await HomeDirector.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getHomeDirector error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE
export const updateHomeDirector = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "HomeDirector ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid HomeDirector ID" });
    }

    const existing = await HomeDirector.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeDirector not found" });
    }

    const setPayload = {};
    if (typeof req.body.Title !== "undefined") {
      const v = norm(req.body.Title);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Title cannot be empty" }); }
      setPayload.Title = v;
    }
    if (typeof req.body.Text !== "undefined") {
      const v = norm(req.body.Text);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Text cannot be empty" }); }
      setPayload.Text = v;
    }

    // files: support upload.single('Vedios') or fields
    const files = req.files || {};
    const fileFromFields = Array.isArray(files.Vedios) && files.Vedios.length ? files.Vedios[0] : undefined;
    const file = req.file || fileFromFields;

    if (file) {
      const uploadResult = await uploadOnCloudinary(file.path);
      if (!uploadResult) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Video upload failed." });
      }
      setPayload.Vedios = uploadResult.secure_url || uploadResult.url || "";
    } else if (typeof req.body.Vedios !== "undefined") {
      const v = norm(req.body.Vedios);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Vedios cannot be empty" }); }
      setPayload.Vedios = v;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await HomeDirector.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeDirector updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeDirector error:", err);
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
export const deleteHomeDirector = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "HomeDirector ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid HomeDirector ID" });
    }

    const existing = await HomeDirector.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeDirector not found" });
    }

    await HomeDirector.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeDirector deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeDirector error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
