// Controller/CatagoryController.js
import mongoose from "mongoose";
import Catagory from "../../Model/Product/Catagory.js"; // adjust path if needed
import Subcatagory from "../../Model/Product/Subcatagory.js";
import Product from "../../Model/Product/Product.js";

import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // adjust path to your cloudinary util

// helper to normalize values
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const requireFieldsForCreate = (body) => {
  const missing = [];
  if (!norm(body.Name)) missing.push("Name");
  if (!norm(body.Dtext)) missing.push("Dtext");
  // Img is expected as an uploaded file; don't require body.Img here.
  if (!norm(body.KeyP1)) missing.push("KeyP1");
  if (!norm(body.KeyP2)) missing.push("KeyP2");
  if (!norm(body.KeyP3)) missing.push("KeyP3");
  return missing;
};

export const createCatagory = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // files via multer
   const files = req.files || {};
    const file = Array.isArray(files.Img) ? files.Img[0] : undefined;

    const payload = {
      Name: norm(req.body.Name),
      Dtext: norm(req.body.Dtext),
      Img: undefined, // will set after upload
      KeyP1: norm(req.body.KeyP1),
      KeyP2: norm(req.body.KeyP2),
      KeyP3: norm(req.body.KeyP3),
    };

    // Validation
    const missing = requireFieldsForCreate(req.body);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    // Image required on create — ensure file present
    if (!file) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img file is required." });
    }

    // Upload to Cloudinary (uploadOnCloudinary removes local file after upload)
    const uploadResult = await uploadOnCloudinary(file.path);
    if (!uploadResult) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "Image upload failed." });
    }
    payload.Img = uploadResult.secure_url || uploadResult.url || "";

    // create using new + save
    const cat = new Catagory(payload);
    await cat.save({ session });

    await session.commitTransaction();

    // fetch saved doc (non-transactional read)
    const result = await Catagory.findById(cat._id);
    return res.status(201).json({ success: true, message: "Catagory created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createCatagory error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const getCatagory = async (req, res) => {
  try {
    const items = await Catagory.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("listCatagories error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



export const updateCatagory = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Catagory ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    const existing = await Catagory.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Catagory not found" });
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
    if (typeof req.body.KeyP3 !== "undefined") {
      const v = norm(req.body.KeyP3);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "KeyP3 cannot be empty" }); }
      setPayload.KeyP3 = v;
    }

    // files handling
    const files = req.files || {};
    const file = req.file || (Array.isArray(files.Img) ? files.Img[0] : undefined);

    if (file) {
      // upload new image
      const uploadResult = await uploadOnCloudinary(file.path);
      if (!uploadResult) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Image upload failed." });
      }
      setPayload.Img = uploadResult.secure_url || uploadResult.url || "";
      // Note: we do not delete old cloudinary resource because public_id isn't stored.
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await Catagory.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Catagory updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { /* ignore */ }
    console.error("updateCatagory error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  } finally {
    session.endSession();
  }
};

// DELETE Catagory (cascade: subcatagories + products)
export const deleteCatagory = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Catagory ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid ID" });
    }

    // ensure category exists
    const existing = await Catagory.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Catagory not found" });
    }

    // 1) find subcat ids belonging to this category
    const subcats = await Subcatagory.find({ Catagory: id }).select("_id").session(session).lean();
    const subcatIds = subcats.map(s => s._id);

    // 2) delete products that belong to this category OR to any subcategory of this category
    //    (CatagoryId === id) OR (SubcatagoryId in subcatIds)
    const prodQuery = {
      $or: [
        { CatagoryId: id },
        ...(subcatIds.length ? [{ SubcatagoryId: { $in: subcatIds } }] : [])
      ]
    };
    await Product.deleteMany(prodQuery).session(session);

    // 3) delete subcatagories
    if (subcatIds.length) {
      await Subcatagory.deleteMany({ _id: { $in: subcatIds } }).session(session);
    }

    // 4) finally delete the category
    await Catagory.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Catagory and related Subcatagories & Products deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteCatagory error:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
  } finally {
    session.endSession();
  }
};

