// Controller/BdirectorController.js
import mongoose from "mongoose";
import Bdirector from "../../Model/Aboutus/BDirector.js"; // adjust path
import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // adjust path if needed

// helpers
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const requireFieldsForCreate = (body) => {
  const missing = [];
  if (!norm(body.Img1) && !body.__ALLOW_FILE_UPLOAD__) missing.push("Img1");
  if (!norm(body.Desig1)) missing.push("Desig1");
  if (!norm(body.Dtext1)) missing.push("Dtext1");
  if (!norm(body.Name1)) missing.push("Name1");

  if (!norm(body.Img2) && !body.__ALLOW_FILE_UPLOAD__) missing.push("Img2");
  if (!norm(body.Desig2)) missing.push("Desig2");
  if (!norm(body.Dtext2)) missing.push("Dtext2");
  if (!norm(body.Name2)) missing.push("Name2");

  if (!norm(body.Img3) && !body.__ALLOW_FILE_UPLOAD__) missing.push("Img3");
  if (!norm(body.Desig3)) missing.push("Desig3");
  if (!norm(body.Dtext3)) missing.push("Dtext3");
  if (!norm(body.Name3)) missing.push("Name3");

  return missing;
};

export const createBdirector = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // support both upload.fields(...) and direct URL in body
    const files = req.files || {};
    const f1 = Array.isArray(files.Img1) && files.Img1.length ? files.Img1[0] : undefined;
    const f2 = Array.isArray(files.Img2) && files.Img2.length ? files.Img2[0] : undefined;
    const f3 = Array.isArray(files.Img3) && files.Img3.length ? files.Img3[0] : undefined;

    // helper flag to inform validator that file upload is used
    if (f1 || f2 || f3) {
      req.body.__ALLOW_FILE_UPLOAD__ = true;
    }

    const missing = requireFieldsForCreate(req.body);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    const payload = {
      Img1: norm(req.body.Img1),
      Desig1: norm(req.body.Desig1),
      Dtext1: norm(req.body.Dtext1),
      Name1: norm(req.body.Name1),

      Img2: norm(req.body.Img2),
      Desig2: norm(req.body.Desig2),
      Dtext2: norm(req.body.Dtext2),
      Name2: norm(req.body.Name2),

      Img3: norm(req.body.Img3),
      Desig3: norm(req.body.Desig3),
      Dtext3: norm(req.body.Dtext3),
      Name3: norm(req.body.Name3),
    };

    // If files provided, upload them and overwrite corresponding Img fields
    if (f1) {
      const up1 = await uploadOnCloudinary(f1.path);
      if (!up1) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img1 upload failed." });
      }
      payload.Img1 = up1.secure_url || up1.url || "";
    }
    if (f2) {
      const up2 = await uploadOnCloudinary(f2.path);
      if (!up2) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img2 upload failed." });
      }
      payload.Img2 = up2.secure_url || up2.url || "";
    }
    if (f3) {
      const up3 = await uploadOnCloudinary(f3.path);
      if (!up3) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img3 upload failed." });
      }
      payload.Img3 = up3.secure_url || up3.url || "";
    }

    // create document
    const doc = new Bdirector(payload);
    await doc.save({ session });

    await session.commitTransaction();

    const result = await Bdirector.findById(doc._id);
    return res.status(201).json({ success: true, message: "Bdirector created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createBdirector error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};



export const getBdirector = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!mongoose.Types.ObjectId.isValid(String(id))) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await Bdirector.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "Bdirector not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    // latest
    if (req.path && req.path.endsWith("/latest")) {
      const latest = await Bdirector.findOne({}).sort({ createdAt: -1 });
      if (!latest) return res.status(404).json({ success: false, message: "No Bdirector found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await Bdirector.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getBdirector error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const updateBdirector = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Bdirector ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await Bdirector.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Bdirector not found" });
    }

    const setPayload = {};

    // simple string updates
    const maybeSet = [
      "Desig1","Dtext1","Name1",
      "Desig2","Dtext2","Name2",
      "Desig3","Dtext3","Name3"
    ];
    for (const k of maybeSet) {
      if (typeof req.body[k] !== "undefined") {
        const v = norm(req.body[k]);
        if (!v) {
          if (session.inTransaction()) await session.abortTransaction();
          return res.status(400).json({ success: false, message: `${k} cannot be empty` });
        }
        setPayload[k] = v;
      }
    }

    // files support or direct URL replacement for Img1/Img2/Img3
    const files = req.files || {};
    const f1 = Array.isArray(files.Img1) && files.Img1.length ? files.Img1[0] : undefined;
    const f2 = Array.isArray(files.Img2) && files.Img2.length ? files.Img2[0] : undefined;
    const f3 = Array.isArray(files.Img3) && files.Img3.length ? files.Img3[0] : undefined;

    if (f1) {
      const up1 = await uploadOnCloudinary(f1.path);
      if (!up1) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img1 upload failed." });
      }
      setPayload.Img1 = up1.secure_url || up1.url || "";
    } else if (typeof req.body.Img1 !== "undefined") {
      const v = norm(req.body.Img1);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Img1 cannot be empty" }); }
      setPayload.Img1 = v;
    }

    if (f2) {
      const up2 = await uploadOnCloudinary(f2.path);
      if (!up2) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img2 upload failed." });
      }
      setPayload.Img2 = up2.secure_url || up2.url || "";
    } else if (typeof req.body.Img2 !== "undefined") {
      const v = norm(req.body.Img2);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Img2 cannot be empty" }); }
      setPayload.Img2 = v;
    }

    if (f3) {
      const up3 = await uploadOnCloudinary(f3.path);
      if (!up3) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img3 upload failed." });
      }
      setPayload.Img3 = up3.secure_url || up3.url || "";
    } else if (typeof req.body.Img3 !== "undefined") {
      const v = norm(req.body.Img3);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Img3 cannot be empty" }); }
      setPayload.Img3 = v;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await Bdirector.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Bdirector updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateBdirector error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteBdirector = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Bdirector ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid Bdirector ID" });
    }

    const existing = await Bdirector.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Bdirector not found" });
    }

    await Bdirector.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Bdirector deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteBdirector error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
