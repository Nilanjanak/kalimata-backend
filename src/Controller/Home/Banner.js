import mongoose from "mongoose";
import HomeBanner  from "../../Model/Home/Banner.js"; // adjust path if needed
import uploadOnCloudinary from "../../Utils/Cloudinary.js";

/** Upload helper: returns { url, public_id } or null */
const uploadFile = async (file) => {
  if (!file || !file.path) return null;
  const r = await uploadOnCloudinary(file.path);
  if (!r) return null;
  return { url: r.secure_url || r.url || null, public_id: r.public_id || null };
};

/** Safely parse req.body when body might be a JSON string inside multipart form */
const parseBodySafely = (raw) => {
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) return parsed;
    } catch (e) { /* not JSON */ }
  }
  return {};
};

/**
 * Create HomeBanner
 * - multipart/form-data
 * - files: Vedios1, Vedios2, Vedios3 (each max 1) - required
 * - body: Htext, Bp1, Bp2, Bp3 - required
 */
export const createHomeBanner = async (req, res) => {
  try {
    const files = req.files || {};
    const body = parseBodySafely(req.body);

    // Validate required text fields
    const requiredTexts = ["Htext", "Bp1", "Bp2", "Bp3"];
    const missingText = requiredTexts.filter((k) => !Object.prototype.hasOwnProperty.call(body, k) || !body[k]);
    if (missingText.length) {
      return res.status(400).json({ success: false, message: `Missing required fields: ${missingText.join(", ")}` });
    }

    // Validate required video files
    const requiredFiles = ["Vedios1", "Vedios2", "Vedios3"];
    const missingFiles = requiredFiles.filter((k) => !files[k] || !Array.isArray(files[k]) || !files[k][0]);
    if (missingFiles.length) {
      return res.status(400).json({ success: false, message: `Missing required video files: ${missingFiles.join(", ")}` });
    }

    // Upload videos (parallel)
    const uploadPromises = requiredFiles.map((k) => uploadFile(files[k][0]));
    const uploadResults = await Promise.all(uploadPromises);

    if (uploadResults.some((r) => !r || !r.url)) {
      return res.status(500).json({ success: false, message: "One or more video uploads failed" });
    }

    const payload = {
      Vedios1: uploadResults[0].url,
      Vedios2: uploadResults[1].url,
      Vedios3: uploadResults[2].url,
      Htext: body.Htext,
      Bp1: body.Bp1,
      Bp2: body.Bp2,
      Bp3: body.Bp3,
    };

    const banner = new HomeBanner(payload);
    const saved = await banner.save();

    return res.status(201).json({ success: true, message: "HomeBanner created", data: saved });
  } catch (err) {
    console.error("createHomeBanner error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
};

/** Get all HomeBanners */
export const getAllHomeBanners = async (req, res) => {
  try {
    const items = await HomeBanner.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    console.error("getAllHomeBanners error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
};

/** Get one HomeBanner by id */
// export const getHomeBannerById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const item = await HomeBanner.findById(id);
//     if (!item) return res.status(404).json({ success: false, message: "HomeBanner not found" });
//     return res.status(200).json({ success: true, data: item });
//   } catch (err) {
//     console.error("getHomeBannerById error:", err);
//     return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
//   }
// };

/**
 * Update HomeBanner
 * - multipart/form-data
 * - files: Vedios1, Vedios2, Vedios3 (optional; if provided each replaces corresponding field)
 * - body: Htext, Bp1, Bp2, Bp3 (optional)
 */
export const updateHomeBanner = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "HomeBanner id is required" });

    const existing = await HomeBanner.findById(id);
    if (!existing) return res.status(404).json({ success: false, message: "HomeBanner not found" });

    const files = req.files || {};
    const body = parseBodySafely(req.body);

    const updatePayload = {};

    // Text updates if present
    ["Htext", "Bp1", "Bp2", "Bp3"].forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(body, k) && body[k] !== undefined) updatePayload[k] = body[k];
    });

    // Video file replacements (each optional)
    const videoFields = ["Vedios1", "Vedios2", "Vedios3"];
    const uploadTasks = videoFields.map(async (field, idx) => {
      if (files[field] && Array.isArray(files[field]) && files[field][0]) {
        const r = await uploadFile(files[field][0]);
        if (!r || !r.url) throw new Error(`Upload failed for ${field}`);
        updatePayload[field] = r.url;
      }
      return null;
    });

    // Run uploads (if any)
    await Promise.all(uploadTasks);

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({ success: false, message: "No fields or files provided to update." });
    }

    const updated = await HomeBanner.findByIdAndUpdate(id, { $set: updatePayload }, { new: true, runValidators: true });
    return res.status(200).json({ success: true, message: "HomeBanner updated", data: updated });
  } catch (err) {
    console.error("updateHomeBanner error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
};

/** Delete HomeBanner */
export const deleteHomeBanner = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "HomeBanner id is required" });

    const deleted = await HomeBanner.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "HomeBanner not found" });

    // Optional: if you saved public_ids, remove Cloudinary assets here.

    return res.status(200).json({ success: true, message: "HomeBanner deleted", data: deleted });
  } catch (err) {
    console.error("deleteHomeBanner error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  }
};
