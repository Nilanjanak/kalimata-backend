// Controller/FooterController.js
import mongoose from "mongoose";
import Footer from "../Model/Footer.js"; // adjust path if needed
import Factaddress from "../Model/factoryaddress.js"; // adjust path / filename as required

// helper: trim and return undefined for empty strings
const norm = (v) => {
  if (typeof v === "undefined" || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};

const requireFieldsForCreate = (body) => {
  // required: SocialLink1..4 and copyrightText
  const missing = [];
  for (let i = 1; i <= 4; i++) {
    if (!norm(body[`SocialLink${i}`])) missing.push(`SocialLink${i}`);
  }
  if (!norm(body.copyrightText)) missing.push("copyrightText");
  return missing;
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * CREATE / UPSERT
 * - Will upsert a single Footer document (replace/create).
 * - IMPORTANT: factoryaddress is NOT required or validated here. It is expected
 *   to be created/inserted later by your factoryaddress controller (which should
 *   call Footer update to attach the factoryaddress id).
 */
export const createFooter = async (req, res) => {
  try {
    const payload = {
      SocialLink1: norm(req.body.SocialLink1),
      SocialLink2: norm(req.body.SocialLink2),
      SocialLink3: norm(req.body.SocialLink3),
      SocialLink4: norm(req.body.SocialLink4),
      SocialLink5: norm(req.body.SocialLink5),
      SocialLink6: norm(req.body.SocialLink6),
      SocialLink7: norm(req.body.SocialLink7),
      copyrightText: norm(req.body.copyrightText),
      contactno: norm(req.body.contactno),
      mailId: norm(req.body.mailId),
      address: norm(req.body.address),
      factoryaddress:[]
      // NOTE: intentionally DO NOT set payload.factoryaddress here even if provided.
      // The factoryaddress will be inserted later by the factoryaddress controller.
    };

    const missing = requireFieldsForCreate(req.body);
    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    const updated = await Footer.findOneAndUpdate(
      {},
      { $set: payload },
      { new: true, upsert: true, runValidators: true }
    ).populate("factoryaddress");

    return res
      .status(201)
      .json({ success: true, message: "Footer created/updated", data: updated });
  } catch (err) {
    console.error("createFooter error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: err.message });
  }
};

/**
 * UPDATE - partial allowed. PATCH /update/:id
 * - Uses transaction/session.
 * - Validates factoryaddress if provided (does NOT create it).
 *   This allows your factoryaddress controller to attach the created factoryaddress id
 *   to the existing footer by calling this update endpoint (or by updating the model directly).
 */
export const updateFooter = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const { id } = req.params;
    if (!id) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Footer ID is required" });
    }
    if (!isValidObjectId(id)) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid Footer ID" });
    }

    const existing = await Footer.findById(id).session(session);
    if (!existing) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Footer not found" });
    }

    const setPayload = {};

    // required links — if provided they cannot be empty
    for (let i = 1; i <= 4; i++) {
      const key = `SocialLink${i}`;
      if (typeof req.body[key] !== "undefined") {
        const v = norm(req.body[key]);
        if (!v) {
          await session.abortTransaction();
          return res
            .status(400)
            .json({ success: false, message: `${key} cannot be empty` });
        }
        setPayload[key] = v;
      }
    }

    // optional links
    for (let i of [5, 6, 7]) {
      const key = `SocialLink${i}`;
      if (typeof req.body[key] !== "undefined") {
        const v = norm(req.body[key]);
        if (typeof v === "undefined") {
          await session.abortTransaction();
          return res.status(400).json({
            success: false,
            message: `${key} cannot be empty if provided`,
          });
        }
        setPayload[key] = v;
      }
    }

    // other fields
    if (typeof req.body.copyrightText !== "undefined") {
      const v = norm(req.body.copyrightText);
      if (!v) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ success: false, message: "copyrightText cannot be empty" });
      }
      setPayload.copyrightText = v;
    }
    if (typeof req.body.contactno !== "undefined") {
      const v = norm(req.body.contactno);
      if (!v) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: "contactno cannot be empty" });
      }
      setPayload.contactno = v;
    }
    if (typeof req.body.mailId !== "undefined") {
      const v = norm(req.body.mailId);
      if (!v) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: "mailId cannot be empty" });
      }
      setPayload.mailId = v;
    }
    if (typeof req.body.address !== "undefined") {
      const v = norm(req.body.address);
      if (!v) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: "address cannot be empty" });
      }
      setPayload.address = v;
    }

    // factoryaddress update: only accept existing id (we do NOT create it here)
    if (typeof req.body.factoryaddress !== "undefined") {
      const faId = norm(req.body.factoryaddress);
      if (!faId) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ success: false, message: "factoryaddress cannot be empty if provided" });
      }
      if (!isValidObjectId(faId)) {
        await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid factoryaddress id" });
      }
      const exists = await Factaddress.findById(faId).session(session).lean();
      if (!exists) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "factoryaddress not found — create it via factoryaddress controller first",
        });
      }
      setPayload.factoryaddress = faId;
    }

    if (Object.keys(setPayload).length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updated = await Footer.findByIdAndUpdate(
      id,
      { $set: setPayload },
      { new: true, runValidators: true, session }
    ).populate("factoryaddress");

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Footer updated", data: updated });
  } catch (err) {
    await session.abortTransaction();
    console.error("updateFooter error:", err);
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: "Validation failed", errors });
    }
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};

/**
 * GET - by id or latest
 * - GET /:id  => get by id
 * - GET /     => get latest
 */
export const getFooter = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      if (!isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: "Invalid Footer ID" });
      }
      const doc = await Footer.findById(id).populate("factoryaddress");
      if (!doc) return res.status(404).json({ success: false, message: "Footer not found" });
      return res.status(200).json({ success: true, data: doc });
    }

    const latest = await Footer.findOne({}).sort({ createdAt: -1 }).populate("factoryaddress");
    if (!latest) return res.status(404).json({ success: false, message: "No footer document found" });
    return res.status(200).json({ success: true, data: latest });
  } catch (err) {
    console.error("getFooter error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error", error: err.message });
  }
};
