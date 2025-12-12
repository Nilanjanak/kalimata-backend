// Controller/MandVController.js
import mongoose from "mongoose";
import MandV from "../../Model/Aboutus/MandV.js"; // adjust path if needed
import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // adjust path if needed

// helpers
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const requireFieldsForCreate = (body) => {
  const missing = [];
  if (!norm(body.Htext1)) missing.push("Htext1");
  if (!norm(body.Dtext1)) missing.push("Dtext1");
  if (!norm(body.Htext2)) missing.push("Htext2");
  if (!norm(body.Dtext2)) missing.push("Dtext2");
  // Img1/Img2 handled separately (file upload or direct URL)
  return missing;
};

export const createMandV = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Support upload.single('Img1')/upload.single('Img2') or upload.fields([{name:'Img1'},{name:'Img2'}])
    const files = req.files || {};
    const fileImg1 = (Array.isArray(files.Img1) && files.Img1[0]) || undefined;
    const fileImg2 = (Array.isArray(files.Img2) && files.Img2[0]) || undefined;
    // also support req.file when user uses single middleware; check both fields
    const fileSingle = req.file;
    // If req.file exists, router likely used single - try to infer by fieldname
    const fileFromSingleImg1 = fileSingle && fileSingle.fieldname === "Img1" ? fileSingle : undefined;
    const fileFromSingleImg2 = fileSingle && fileSingle.fieldname === "Img2" ? fileSingle : undefined;
    const img1File = fileImg1 || fileFromSingleImg1;
    const img2File = fileImg2 || fileFromSingleImg2;

    const payload = {
      Img1: undefined,
      Htext1: norm(req.body.Htext1),
      Dtext1: norm(req.body.Dtext1),
      Img2: undefined,
      Htext2: norm(req.body.Htext2),
      Dtext2: norm(req.body.Dtext2),
    };

    // validate required text fields
    const missing = requireFieldsForCreate(req.body);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    // require images on create (either uploaded files or URLs in body)
    if (!img1File && !req.body.Img1) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img1 is required (file upload or Img1 URL in body)." });
    }
    if (!img2File && !req.body.Img2) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img2 is required (file upload or Img2 URL in body)." });
    }

    // upload files if present and set payload.Img1 / Img2
    if (img1File) {
      const up1 = await uploadOnCloudinary(img1File.path);
      if (!up1) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img1 upload failed." });
      }
      payload.Img1 = up1.secure_url || up1.url || "";
    } else if (req.body.Img1) {
      payload.Img1 = norm(req.body.Img1);
    }

    if (img2File) {
      const up2 = await uploadOnCloudinary(img2File.path);
      if (!up2) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img2 upload failed." });
      }
      payload.Img2 = up2.secure_url || up2.url || "";
    } else if (req.body.Img2) {
      payload.Img2 = norm(req.body.Img2);
    }

    const doc = new MandV(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await MandV.findById(doc._id);
    return res.status(201).json({ success: true, message: "MandV created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createMandV error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};



export const getMandV = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await MandV.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "MandV not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    // latest
    if (req.path && req.path.endsWith("/latest")) {
      const latest = await MandV.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No MandV found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await MandV.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getMandV error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateMandV = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "MandV ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid MandV ID" });
    }

    const existing = await MandV.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "MandV not found" });
    }

    const setPayload = {};

    if (typeof req.body.Htext1 !== "undefined") {
      const v = norm(req.body.Htext1);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Htext1 cannot be empty" }); }
      setPayload.Htext1 = v;
    }
    if (typeof req.body.Dtext1 !== "undefined") {
      const v = norm(req.body.Dtext1);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Dtext1 cannot be empty" }); }
      setPayload.Dtext1 = v;
    }
    if (typeof req.body.Htext2 !== "undefined") {
      const v = norm(req.body.Htext2);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Htext2 cannot be empty" }); }
      setPayload.Htext2 = v;
    }
    if (typeof req.body.Dtext2 !== "undefined") {
      const v = norm(req.body.Dtext2);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Dtext2 cannot be empty" }); }
      setPayload.Dtext2 = v;
    }

    // files support (same approach as create)
    const files = req.files || {};
    const fileImg1 = (Array.isArray(files.Img1) && files.Img1[0]) || undefined;
    const fileImg2 = (Array.isArray(files.Img2) && files.Img2[0]) || undefined;
    const fileSingle = req.file;
    const fileFromSingleImg1 = fileSingle && fileSingle.fieldname === "Img1" ? fileSingle : undefined;
    const fileFromSingleImg2 = fileSingle && fileSingle.fieldname === "Img2" ? fileSingle : undefined;
    const img1File = fileImg1 || fileFromSingleImg1;
    const img2File = fileImg2 || fileFromSingleImg2;

    if (img1File) {
      const up1 = await uploadOnCloudinary(img1File.path);
      if (!up1) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "Img1 upload failed." }); }
      setPayload.Img1 = up1.secure_url || up1.url || "";
    } else if (typeof req.body.Img1 !== "undefined") {
      const v = norm(req.body.Img1);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Img1 cannot be empty" }); }
      setPayload.Img1 = v;
    }

    if (img2File) {
      const up2 = await uploadOnCloudinary(img2File.path);
      if (!up2) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "Img2 upload failed." }); }
      setPayload.Img2 = up2.secure_url || up2.url || "";
    } else if (typeof req.body.Img2 !== "undefined") {
      const v = norm(req.body.Img2);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Img2 cannot be empty" }); }
      setPayload.Img2 = v;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await MandV.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "MandV updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateMandV error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteMandV = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "MandV ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid MandV ID" });
    }

    const existing = await MandV.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "MandV not found" });
    }

    await MandV.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "MandV deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteMandV error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
