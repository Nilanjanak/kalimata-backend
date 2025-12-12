// Controller/ProductController.js
import mongoose from "mongoose";
import Product from "../../Model/Product/Product.js"; // adjust path
import Catagory from "../../Model/Product/Catagory.js"; // adjust path
import Subcatagory from "../../Model/Product/Subcatagory.js"; // adjust path
import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // adjust path

// helpers
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * Validation rules aligned with provided Product schema:
 * - Name (required)
 * - Dtext (required)
 * - Img1/Img2/Img3 (required files)
 * - Cline1..6, Tspec1..10, App1..6 are optional
 */
const requiredFieldsForCreate = (body) => {
  const missing = [];
  if (!norm(body.Name)) missing.push("Name");
  if (!norm(body.Dtext)) missing.push("Dtext");
  return missing;
};

/**
 * POST /api/v1/product/create
 * Expects files: Img1, Img2, Img3 via upload.fields(...)
 */
export const createProduct = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const files = req.files || {};
    const file1 = Array.isArray(files.Img1) && files.Img1.length ? files.Img1[0] : undefined;
    const file2 = Array.isArray(files.Img2) && files.Img2.length ? files.Img2[0] : undefined;
    const file3 = Array.isArray(files.Img3) && files.Img3.length ? files.Img3[0] : undefined;

    const payload = {
      Name: norm(req.body.Name),
      Dtext: norm(req.body.Dtext),
      Img1: undefined,
      Img2: undefined,
      Img3: undefined,
      CatagoryId: undefined,
      SubcatagoryId: undefined,
      // optional Cline fields
      Cline1: norm(req.body.Cline1),
      Cline2: norm(req.body.Cline2),
      Cline3: norm(req.body.Cline3),
      Cline4: norm(req.body.Cline4),
      Cline5: norm(req.body.Cline5),
      Cline6: norm(req.body.Cline6),
      // optional Tspecs
      Tspec1: norm(req.body.Tspec1),
      Tspec2: norm(req.body.Tspec2),
      Tspec3: norm(req.body.Tspec3),
      Tspec4: norm(req.body.Tspec4),
      Tspec5: norm(req.body.Tspec5),
      Tspec6: norm(req.body.Tspec6),
      Tspec7: norm(req.body.Tspec7),
      Tspec8: norm(req.body.Tspec8),
      Tspec9: norm(req.body.Tspec9),
      Tspec10: norm(req.body.Tspec10),
      // optional Apps
      App1: norm(req.body.App1),
      App2: norm(req.body.App2),
      App3: norm(req.body.App3),
      App4: norm(req.body.App4),
      App5: norm(req.body.App5),
      App6: norm(req.body.App6),
    };

    // required fields (except images)
    const missing = requiredFieldsForCreate(req.body);
    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    // Images required
    if (!file1 || !file2 || !file3) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img1, Img2 and Img3 files are required." });
    }

    // Validate CatagoryId/SubcatagoryId if provided
    if (typeof req.body.CatagoryId !== "undefined") {
      const catId = norm(req.body.CatagoryId);
      if (!catId) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "CatagoryId cannot be empty if provided." });
      }
      if (!isValidObjectId(catId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid CatagoryId." });
      }
      const catExists = await Catagory.findById(catId).session(session).lean();
      if (!catExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced Catagory not found." });
      }
      payload.CatagoryId = catId;
    }

    if (typeof req.body.SubcatagoryId !== "undefined") {
      const subId = norm(req.body.SubcatagoryId);
      if (!subId) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "SubcatagoryId cannot be empty if provided." });
      }
      if (!isValidObjectId(subId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid SubcatagoryId." });
      }
      const subExists = await Subcatagory.findById(subId).session(session).lean();
      if (!subExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced Subcatagory not found." });
      }
      payload.SubcatagoryId = subId;
    }

    // Upload images to Cloudinary
    const up1 = await uploadOnCloudinary(file1.path);
    if (!up1) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "Img1 upload failed." });
    }
    payload.Img1 = up1.secure_url || up1.url || "";

    const up2 = await uploadOnCloudinary(file2.path);
    if (!up2) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "Img2 upload failed." });
    }
    payload.Img2 = up2.secure_url || up2.url || "";

    const up3 = await uploadOnCloudinary(file3.path);
    if (!up3) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "Img3 upload failed." });
    }
    payload.Img3 = up3.secure_url || up3.url || "";

    // create product using new + save
    const prod = new Product(payload);
    await prod.save({ session });

    await session.commitTransaction();

    const result = await Product.findById(prod._id).populate("CatagoryId SubcatagoryId");
    return res.status(201).json({ success: true, message: "Product created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createProduct error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * GET list or single/latest
 * GET /api/v1/product         -> list
 * GET /api/v1/product/latest  -> latest
 * GET /api/v1/product/:id     -> single
 */
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid ID" });
      const doc = await Product.findById(id).populate("CatagoryId SubcatagoryId");
      if (!doc) return res.status(404).json({ success: false, message: "Product not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    // if route /latest
    if (req.path && req.path.endsWith("/latest")) {
      const latest = await Product.findOne({}).sort({ createdAt: -1 }).populate("CatagoryId SubcatagoryId");
      if (!latest) return res.status(404).json({ success: false, message: "No product found" });
      return res.status(200).json({ success: true, data: latest });
    }

    const items = await Product.find({}).sort({ createdAt: -1 }).populate("CatagoryId SubcatagoryId");
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("getProduct error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PATCH /api/v1/product/update/:id
 * Accepts optional files Img1, Img2, Img3 (upload.fields)
 */
export const updateProduct = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Product ID required" });
    }
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid Product ID" });
    }

    const existing = await Product.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const setPayload = {};

    // Name & Dtext: if provided must be non-empty (same as before)
    if (typeof req.body.Name !== "undefined") {
      const v = norm(req.body.Name);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Name cannot be empty" });
      }
      setPayload.Name = v;
    }

    if (typeof req.body.Dtext !== "undefined") {
      const v = norm(req.body.Dtext);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Dtext cannot be empty" });
      }
      setPayload.Dtext = v;
    }

    // update Cline fields (optional in schema).
    // If provided, accept and store trimmed value OR empty string (""), do not reject.
    const clines = ["Cline1","Cline2","Cline3","Cline4","Cline5","Cline6"];
    for (const k of clines) {
      if (typeof req.body[k] !== "undefined") {
        // allow empty value -> store empty string
        const raw = req.body[k];
        const v = raw === null || raw === undefined ? "" : String(raw).trim();
        // store value (can be empty string)
        setPayload[k] = v;
      }
    }

    // update Tspec1..Tspec10 (optional in schema)
    // If provided, accept and store trimmed value OR empty string (""), do not reject.
    for (let i = 1; i <= 10; i++) {
      const k = `Tspec${i}`;
      if (typeof req.body[k] !== "undefined") {
        const raw = req.body[k];
        const v = raw === null || raw === undefined ? "" : String(raw).trim();
        setPayload[k] = v;
      }
    }

    // update App1..App6 (optional)
    // If provided, accept and store trimmed value OR empty string (""), do not reject.
    for (let i = 1; i <= 6; i++) {
      const k = `App${i}`;
      if (typeof req.body[k] !== "undefined") {
        const raw = req.body[k];
        const v = raw === null || raw === undefined ? "" : String(raw).trim();
        setPayload[k] = v;
      }
    }

    // Catagory/Subcat validation if present (unchanged)
    if (typeof req.body.CatagoryId !== "undefined") {
      const catId = norm(req.body.CatagoryId);
      if (!catId) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "CatagoryId cannot be empty" });
      }
      if (!isValidObjectId(catId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid CatagoryId" });
      }
      const catExists = await Catagory.findById(catId).session(session).lean();
      if (!catExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced Catagory not found" });
      }
      setPayload.CatagoryId = catId;
    }

    if (typeof req.body.SubcatagoryId !== "undefined") {
      const subId = norm(req.body.SubcatagoryId);
      if (!subId) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "SubcatagoryId cannot be empty" });
      }
      if (!isValidObjectId(subId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid SubcatagoryId" });
      }
      const subExists = await Subcatagory.findById(subId).session(session).lean();
      if (!subExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced Subcatagory not found" });
      }
      setPayload.SubcatagoryId = subId;
    }

    // Files handling (support upload.fields)
    const files = req.files || {};
    const f1 = Array.isArray(files.Img1) && files.Img1.length ? files.Img1[0] : undefined;
    const f2 = Array.isArray(files.Img2) && files.Img2.length ? files.Img2[0] : undefined;
    const f3 = Array.isArray(files.Img3) && files.Img3.length ? files.Img3[0] : undefined;

    if (f1) {
      const up = await uploadOnCloudinary(f1.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img1 upload failed." });
      }
      setPayload.Img1 = up.secure_url || up.url || "";
    }
    if (f2) {
      const up = await uploadOnCloudinary(f2.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img2 upload failed." });
      }
      setPayload.Img2 = up.secure_url || up.url || "";
    }
    if (f3) {
      const up = await uploadOnCloudinary(f3.path);
      if (!up) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(500).json({ success: false, message: "Img3 upload failed." });
      }
      setPayload.Img3 = up.secure_url || up.url || "";
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await Product.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    const result = await Product.findById(updated._id).populate("CatagoryId SubcatagoryId");
    return res.status(200).json({ success: true, message: "Product updated", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateProduct error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * DELETE /api/v1/product/delete/:id
 */
export const deleteProduct = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Product ID required" });
    }
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid Product ID" });
    }

    const existing = await Product.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Product.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Product deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteProduct error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
