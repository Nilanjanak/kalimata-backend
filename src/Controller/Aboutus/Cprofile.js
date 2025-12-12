// Controller/CProfileController.js
import mongoose from "mongoose";
import CProfile from "../../Model/Aboutus/CProfile.js"; // adjust path if needed
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
  // Img handled separately (file or URL)
  return missing;
};

export const createCProfile = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // support upload.single('Img') or upload.fields([{name:'Img',maxCount:1}])
    const files = req.files || {};
    const fileFromFields = Array.isArray(files.Img) && files.Img.length ? files.Img[0] : undefined;
    const file = req.file || fileFromFields;

    const payload = {
      Img: undefined,
      Htext: norm(req.body.Htext),
      Dtext: norm(req.body.Dtext),
    };

    // validate required text fields
    const missing = requireFieldsForCreate(req.body);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    // require image on create
    if (!file && !payload.Img && !req.body.Img) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img file is required." });
    }

    // if uploaded file present, upload to Cloudinary
    if (file) {
      const uploadResult = await uploadOnCloudinary(file.path);
      if (!uploadResult) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Image upload failed." });
      }
      payload.Img = uploadResult.secure_url || uploadResult.url || "";
    } else if (req.body.Img) {
      // allow direct URL in body
      payload.Img = norm(req.body.Img);
    }

    const profile = new CProfile(payload);
    await profile.save({ session });

    await session.commitTransaction();

    const result = await CProfile.findById(profile._id);
    return res.status(201).json({ success: true, message: "CProfile created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createCProfile error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};



export const getCProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await CProfile.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "CProfile not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    // latest support
    if (req.path && req.path.endsWith("/latest")) {
      const latest = await CProfile.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No CProfile found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await CProfile.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getCProfile error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateCProfile = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "CProfile ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid CProfile ID" });
    }

    const existing = await CProfile.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "CProfile not found" });
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

    // files support
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

    const updated = await CProfile.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "CProfile updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateCProfile error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteCProfile = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "CProfile ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid CProfile ID" });
    }

    const existing = await CProfile.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "CProfile not found" });
    }

    await CProfile.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "CProfile deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteCProfile error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
