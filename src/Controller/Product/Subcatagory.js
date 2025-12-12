// Controller/Product/Subcatagory.js
import mongoose from "mongoose";
import Subcatagory from "../../Model/Product/Subcatagory.js"; // adjust path if needed
import Catagory from "../../Model/Product/Catagory.js"; // adjust path if needed
import Product from "../../Model/Product/Product.js"; // IMPORTANT: import Product for cascade delete
import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // adjust path to your cloudinary util

// helpers
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

const requireFieldsForCreate = (body) => {
  const missing = [];
  if (!norm(body.Name)) missing.push("Name");
  if (!norm(body.Dtext)) missing.push("Dtext");
  // Img is expected as a file upload; treat it separately in controller
  return missing;
};

/**
 * CREATE - POST /api/v1/subcatagory/create
 * Expects file in field "Img" (multer single or fields)
 */
export const createSubcatagory = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Accept both upload.single('Img') -> req.file
    // and upload.fields([{name: 'Img', maxCount:1}]) -> req.files.Img[0]
    const files = req.files || {};
    const fileFromFields = Array.isArray(files.Img) && files.Img.length ? files.Img[0] : undefined;
    const file = req.file || fileFromFields;

    const payload = {
      Name: norm(req.body.Name),
      Dtext: norm(req.body.Dtext),
      Img: undefined, // set after upload
      KeyP1: norm(req.body.KeyP1),
      KeyP2: norm(req.body.KeyP2),
      Catagory: undefined,
    };

    // required field check (Img handled separately)
    const missing = requireFieldsForCreate(req.body);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    // Image required on create
    if (!file) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img file is required." });
    }

    // optional Catagory validation
    if (typeof req.body.Catagory !== "undefined") {
      const catId = norm(req.body.Catagory);
      if (!catId) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Catagory cannot be empty if provided" });
      }
      if (!isValidObjectId(catId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid Catagory id" });
      }
      const catExists = await Catagory.findById(catId).session(session).lean();
      if (!catExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced Catagory not found" });
      }
      payload.Catagory = catId;
    }

    // Upload image to Cloudinary
    const uploadResult = await uploadOnCloudinary(file.path);
    if (!uploadResult) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "Image upload failed." });
    }
    payload.Img = uploadResult.secure_url || uploadResult.url || "";

    // create using new + save
    const sub = new Subcatagory(payload);
    await sub.save({ session });

    await session.commitTransaction();

    const result = await Subcatagory.findById(sub._id).populate("Catagory");
    return res.status(201).json({ success: true, message: "Subcatagory created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createSubcatagory error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * LIST or GET single - GET /api/v1/subcatagory  (list)
 * or GET /api/v1/subcatagory/:id  (single)
 */
export const getSubcatagory = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await Subcatagory.findById(id).populate("Catagory");
      if (!doc) return res.status(404).json({ success: false, message: "Subcatagory not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    const items = await Subcatagory.find({}).sort({ createdAt: -1 }).populate("Catagory");
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("listSubcatagories error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * UPDATE - PATCH /api/v1/subcatagory/update/:id
 * - supports optional image replacement (upload new image to Cloudinary)
 */
export const updateSubcatagory = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Subcatagory ID required" });
    }
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid Subcatagory ID" });
    }

    const existing = await Subcatagory.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Subcatagory not found" });
    }

    const setPayload = {};
    if (typeof req.body.Name !== "undefined") {
      const v = norm(req.body.Name);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Name cannot be empty" }); }
      setPayload.Name = v;
    }
    if (typeof req.body.Dtext !== "undefined") {
      const v = norm(req.body.Dtext);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Dtext cannot be empty" }); }
      setPayload.Dtext = v;
    }
    if (typeof req.body.KeyP1 !== "undefined") {
      const v = norm(req.body.KeyP1);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "KeyP1 cannot be empty" }); }
      setPayload.KeyP1 = v;
    }
    if (typeof req.body.KeyP2 !== "undefined") {
      const v = norm(req.body.KeyP2);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "KeyP2 cannot be empty" }); }
      setPayload.KeyP2 = v;
    }

    // Catagory update validation (if provided)
    if (typeof req.body.Catagory !== "undefined") {
      const catId = norm(req.body.Catagory);
      if (!catId) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Catagory cannot be empty if provided" });
      }
      if (!isValidObjectId(catId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid Catagory id" });
      }
      const catExists = await Catagory.findById(catId).session(session).lean();
      if (!catExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced Catagory not found" });
      }
      setPayload.Catagory = catId;
    }

    // file handling (support fields or single)
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
      // If you want to delete old Cloudinary resource, store public_id earlier and destroy here.
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await Subcatagory.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    const result = await Subcatagory.findById(updated._id).populate("Catagory");
    return res.status(200).json({ success: true, message: "Subcatagory updated", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateSubcatagory error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * DELETE - DELETE /api/v1/subcatagory/delete/:id
 */
// DELETE Subcatagory (cascade: products under this subcat)
export const deleteSubcatagory = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Subcatagory ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid Subcatagory ID" });
    }

    const existing = await Subcatagory.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Subcatagory not found" });
    }

    // Delete products that belong to this subcategory
    await Product.deleteMany({ SubcatagoryId: id }).session(session);

    // Delete the subcatagory
    await Subcatagory.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Subcatagory and its Products deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteSubcatagory error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  } finally {
    session.endSession();
  }
};
