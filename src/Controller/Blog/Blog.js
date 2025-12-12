// Controller/BlogController.js
import mongoose from "mongoose";
import Blog from "../../Model/Blog/Blog.js"; // adjust path if needed
import uploadOnCloudinary from "../../Utils/Cloudinary.js"; // adjust path if needed

// helpers
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

export const createBlog = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // support upload.single('Img') and upload.fields([{name:'Img'}])
    const files = req.files || {};
    const fileFromFields = Array.isArray(files.Img) && files.Img.length ? files.Img[0] : undefined;
    const file = req.file || fileFromFields;

    const payload = {
      Img: undefined, // set after upload
      Htext: norm(req.body.Htext),
      Dtext: norm(req.body.Dtext),
      Adress: norm(req.body.Adress),
      Adresslink: norm(req.body.Adresslink),
    };

    // validate required fields
    const missing = [];
    if (!payload.Htext) missing.push("Htext");
    if (!payload.Dtext) missing.push("Dtext");
    if (!payload.Adress) missing.push("Adress");
    if (!payload.Adresslink) missing.push("Adresslink");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing fields: ${missing.join(", ")}` });
    }

    if (!file) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Img file is required." });
    }

    // upload to Cloudinary
    const uploadResult = await uploadOnCloudinary(file.path);
    if (!uploadResult) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(500).json({ success: false, message: "Image upload failed." });
    }
    payload.Img = uploadResult.secure_url || uploadResult.url || "";

    // create using new + save
    const blog = new Blog(payload);
    await blog.save({ session });

    await session.commitTransaction();

    const result = await Blog.findById(blog._id);
    return res.status(201).json({ success: true, message: "Blog created", data: result });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("createBlog error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const getBlog = async (req, res) => {
  try {
    const items = await Blog.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("listBlogs error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};



export const updateBlog = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Blog ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid Blog ID" });
    }

    const existing = await Blog.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Blog not found" });
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
    if (typeof req.body.Adress !== "undefined") {
      const v = norm(req.body.Adress);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Adress cannot be empty" }); }
      setPayload.Adress = v;
    }
    if (typeof req.body.Adresslink !== "undefined") {
      const v = norm(req.body.Adresslink);
      if (!v) { if (session.inTransaction()) await session.abortTransaction(); return res.status(400).json({ success: false, message: "Adresslink cannot be empty" }); }
      setPayload.Adresslink = v;
    }

    // support upload.single('Img') or upload.fields([{name:'Img'}])
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
      // note: to delete old cloudinary image you need to store public_id on upload
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await Blog.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Blog updated", data: updated });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("updateBlog error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

export const deleteBlog = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Blog ID required" });
    }
    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid Blog ID" });
    }

    const existing = await Blog.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Blog not found" });
    }

    await Blog.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Blog deleted" });
  } catch (err) {
    try { if (session.inTransaction()) await session.abortTransaction(); } catch (e) { console.error("abortTransaction error:", e); }
    console.error("deleteBlog error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
