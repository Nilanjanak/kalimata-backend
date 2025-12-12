// Controller/Home/MAndVController.js
import mongoose from "mongoose";
import HomeMissionVisionandValue from "../../Model/Home/HomeMissionVisionandValue.js";
import uploadOnCloudinary from "../../Utils/Cloudinary.js";

const uploadFile = async (file) => {
  if (!file || !file.path) return null;
  const r = await uploadOnCloudinary(file.path);
  if (!r) return null;
  return { url: r.secure_url || r.url || null };
};

const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const parseBodySafely = (raw) => {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {}
  }
  return {};
};

// ---------------------------------------------
// CREATE
// ---------------------------------------------
export const createHomeMissionVisionandValue = async (req, res) => {
  try {
    const files = req.files || {};
    const body = parseBodySafely(req.body);

    // REQUIRED TEXT FIELDS ONLY
    const requiredTexts = [
      "Htext1", "Htext2", "Htext3",
      "Dtext1", "Dtext2", "Dtext3"
    ];
    const missing = requiredTexts.filter((k) => !norm(body[k]));

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // OPTIONAL IMAGES
    const img1File = files.Img1?.[0] || null;
    const img2File = files.Img2?.[0] || null;
    const img3File = files.Img3?.[0] || null;

    // parallel uploads
    const [up1, up2, up3] = await Promise.all([
      img1File ? uploadFile(img1File) : null,
      img2File ? uploadFile(img2File) : null,
      img3File ? uploadFile(img3File) : null,
    ]);

    // payload (images optional)
    const payload = {
      Htext1: body.Htext1,
      Htext2: body.Htext2,
      Htext3: body.Htext3,
      Dtext1: body.Dtext1,
      Dtext2: body.Dtext2,
      Dtext3: body.Dtext3,
      Img1: up1?.url || norm(body.Img1) || undefined,
      Img2: up2?.url || norm(body.Img2) || undefined,
      Img3: up3?.url || norm(body.Img3) || undefined,
    };

    const doc = new HomeMissionVisionandValue(payload);
    const saved = await doc.save();

    return res.status(201).json({
      success: true,
      message: "Created successfully",
      data: saved,
    });
  } catch (err) {
    console.error("create error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------------------------------------
// GET ALL
// ---------------------------------------------
export const getHomeMissionVisionandValueList = async (req, res) => {
  try {
    const items = await HomeMissionVisionandValue.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------------------------------------
// GET SINGLE / LATEST
// ---------------------------------------------
export const getHomeMissionVisionandValue = async (req, res) => {
  try {
    const { id } = req.params;

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid ID" });
      }
      const doc = await HomeMissionVisionandValue.findById(id);
      if (!doc) return res.status(404).json({ success: false, message: "Not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    const latest = await HomeMissionVisionandValue.findOne().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: latest });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------------------------------------
// UPDATE
// ---------------------------------------------
export const updateHomeMissionVisionandValue = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    const files = req.files || {};
    const body = parseBodySafely(req.body);

    const img1File = files.Img1?.[0] || null;
    const img2File = files.Img2?.[0] || null;
    const img3File = files.Img3?.[0] || null;

    const [up1, up2, up3] = await Promise.all([
      img1File ? uploadFile(img1File) : null,
      img2File ? uploadFile(img2File) : null,
      img3File ? uploadFile(img3File) : null,
    ]);

    const update = {};

    // optional text fields
    [
      "Htext1","Htext2","Htext3",
      "Dtext1","Dtext2","Dtext3"
    ].forEach(k => {
      if (body[k] !== undefined) update[k] = norm(body[k]);
    });

    // optional images
    if (up1?.url) update.Img1 = up1.url;
    else if (body.Img1 !== undefined) update.Img1 = norm(body.Img1);

    if (up2?.url) update.Img2 = up2.url;
    else if (body.Img2 !== undefined) update.Img2 = norm(body.Img2);

    if (up3?.url) update.Img3 = up3.url;
    else if (body.Img3 !== undefined) update.Img3 = norm(body.Img3);

    if (Object.keys(update).length === 0)
      return res.status(400).json({ success: false, message: "No data to update" });

    const updated = await HomeMissionVisionandValue.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: updated,
    });

  } catch (err) {
    console.error("update error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------------------------------------
// DELETE
// ---------------------------------------------
export const deleteHomeMissionVisionandValue = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ success: false, message: "Invalid ID" });

    const deleted = await HomeMissionVisionandValue.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ success: false, message: "Not found" });

    return res.status(200).json({ success: true, message: "Deleted" });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
