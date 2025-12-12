// Controller/HomeAboutController.js
import mongoose from "mongoose";
import HomeAbout from "../../Model/Home/About.js"; // adjust path
import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // adjust path

// helper
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const requiredFieldsForCreate = (body) => {
  const missing = [];
  // numbers / texts
  if (!norm(body.Num1)) missing.push("Num1");
  if (!norm(body.Num2)) missing.push("Num2");
  if (!norm(body.Num3)) missing.push("Num3");

  if (!norm(body.Htext1)) missing.push("Htext1");
  if (!norm(body.Htext2)) missing.push("Htext2");
  if (!norm(body.Htext3)) missing.push("Htext3");

  if (!norm(body.Dtext1)) missing.push("Dtext1");
  if (!norm(body.Dtext2)) missing.push("Dtext2");
  if (!norm(body.Dtext3)) missing.push("Dtext3");

  // Img1/Img2/Img3 handled separately (file or URL)
  return missing;
};

export const createHomeAbout = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // support upload.fields([{name:'Img1'},{name:'Img2'},{name:'Img3'}]) or upload.single(...) variants
    const files = req.files || {};
    const fileImg1 = Array.isArray(files.Img1) && files.Img1.length ? files.Img1[0] : undefined;
    const fileImg2 = Array.isArray(files.Img2) && files.Img2.length ? files.Img2[0] : undefined;
    const fileImg3 = Array.isArray(files.Img3) && files.Img3.length ? files.Img3[0] : undefined;

    // also support req.file if single middleware used (infer by fieldname)
    const single = req.file;
    const singleImg1 = single && single.fieldname === "Img1" ? single : undefined;
    const singleImg2 = single && single.fieldname === "Img2" ? single : undefined;
    const singleImg3 = single && single.fieldname === "Img3" ? single : undefined;

    const img1File = fileImg1 || singleImg1;
    const img2File = fileImg2 || singleImg2;
    const img3File = fileImg3 || singleImg3;

    const payload = {
      Num1: norm(req.body.Num1),
      Num2: norm(req.body.Num2),
      Num3: norm(req.body.Num3),
      Img1: undefined,
      Img2: undefined,
      Img3: undefined,
      Htext1: norm(req.body.Htext1),
      Htext2: norm(req.body.Htext2),
      Htext3: norm(req.body.Htext3),
      Dtext1: norm(req.body.Dtext1),
      Dtext2: norm(req.body.Dtext2),
      Dtext3: norm(req.body.Dtext3),
    };

    // validate required text/num fields
    const missing = requiredFieldsForCreate(req.body);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    // ensure images present (either file upload or body URL)
    if (!img1File && !norm(req.body.Img1)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img1 is required (file upload or Img1 URL in body)." });
    }
    if (!img2File && !norm(req.body.Img2)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img2 is required (file upload or Img2 URL in body)." });
    }
    if (!img3File && !norm(req.body.Img3)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img3 is required (file upload or Img3 URL in body)." });
    }

    // upload files if present
    if (img1File) {
      const up = await uploadOnCloudinary(img1File.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img1 upload failed." });
      }
      payload.Img1 = up.secure_url || up.url || "";
    } else {
      payload.Img1 = norm(req.body.Img1);
    }

    if (img2File) {
      const up = await uploadOnCloudinary(img2File.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img2 upload failed." });
      }
      payload.Img2 = up.secure_url || up.url || "";
    } else {
      payload.Img2 = norm(req.body.Img2);
    }

    if (img3File) {
      const up = await uploadOnCloudinary(img3File.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img3 upload failed." });
      }
      payload.Img3 = up.secure_url || up.url || "";
    } else {
      payload.Img3 = norm(req.body.Img3);
    }

    const doc = new HomeAbout(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await HomeAbout.findById(doc._id);
    return res.status(201).json({ success: true, message: "HomeAbout created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createHomeAbout error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const listHomeAbout = async (req, res) => {
  try {
    const items = await HomeAbout.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("listHomeAbout error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getHomeAbout = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await HomeAbout.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "HomeAbout not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    // latest
    if (req.path && req.path.endsWith("/latest")) {
      const latest = await HomeAbout.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No HomeAbout found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await HomeAbout.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getHomeAbout error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateHomeAbout = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "HomeAbout ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid HomeAbout ID" });
    }

    const existing = await HomeAbout.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeAbout not found" });
    }

    const setPayload = {};

    // numeric/text fields
    const maybeFields = ["Num1","Num2","Num3","Htext1","Htext2","Htext3","Dtext1","Dtext2","Dtext3"];
    for (const k of maybeFields) {
      if (typeof req.body[k] !== "undefined") {
        const v = norm(req.body[k]);
        if (!v) {
          if (session.inTransaction()) await session.abortTransaction();
          return res.status(400).json({ success: false, message: `${k} cannot be empty` });
        }
        setPayload[k] = v;
      }
    }

    // files support (Img1/Img2/Img3)
    const files = req.files || {};
    const f1 = Array.isArray(files.Img1) && files.Img1.length ? files.Img1[0] : undefined;
    const f2 = Array.isArray(files.Img2) && files.Img2.length ? files.Img2[0] : undefined;
    const f3 = Array.isArray(files.Img3) && files.Img3.length ? files.Img3[0] : undefined;
    const single = req.file;
    const singleImg1 = single && single.fieldname === "Img1" ? single : undefined;
    const singleImg2 = single && single.fieldname === "Img2" ? single : undefined;
    const singleImg3 = single && single.fieldname === "Img3" ? single : undefined;

    const img1File = f1 || singleImg1;
    const img2File = f2 || singleImg2;
    const img3File = f3 || singleImg3;

    if (img1File) {
      const up = await uploadOnCloudinary(img1File.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "Img1 upload failed." }); }
      setPayload.Img1 = up.secure_url || up.url || "";
    } else if (typeof req.body.Img1 !== "undefined") {
      const v = norm(req.body.Img1);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Img1 cannot be empty" }); }
      setPayload.Img1 = v;
    }

    if (img2File) {
      const up = await uploadOnCloudinary(img2File.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "Img2 upload failed." }); }
      setPayload.Img2 = up.secure_url || up.url || "";
    } else if (typeof req.body.Img2 !== "undefined") {
      const v = norm(req.body.Img2);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Img2 cannot be empty" }); }
      setPayload.Img2 = v;
    }

    if (img3File) {
      const up = await uploadOnCloudinary(img3File.path);
      if (!up) { if (session.inTransaction()) await session.abortTransaction(); return res.status(500).json({ success: false, message: "Img3 upload failed." }); }
      setPayload.Img3 = up.secure_url || up.url || "";
    } else if (typeof req.body.Img3 !== "undefined") {
      const v = norm(req.body.Img3);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Img3 cannot be empty" }); }
      setPayload.Img3 = v;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await HomeAbout.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeAbout updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateHomeAbout error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteHomeAbout = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "HomeAbout ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid HomeAbout ID" });
    }

    const existing = await HomeAbout.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "HomeAbout not found" });
    }

    await HomeAbout.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "HomeAbout deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteHomeAbout error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
