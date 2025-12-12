// Controller/FactaddressController.js
import mongoose from "mongoose";
import Factaddress from "../Model/factoryaddress.js"; // adjust path
import Footer from "../Model/Footer.js"; // adjust path

// helpers
const norm = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
};
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(String(id));

/**
 * POST /api/v1/factaddress/create
 * Create Factaddress (new + save).
 * If footerId provided -> push the created factaddress id into Footer.factoryaddress array.
 */
export const createFactaddress = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // prepare payload
    const payload = {
      Htext: norm(req.body.Htext),
      Dtext: norm(req.body.Dtext),
      link: norm(req.body.link),
      // footerId if validated below
    };

    // required check
    const missing = [];
    if (!payload.Htext) missing.push("Htext");
    if (!payload.Dtext) missing.push("Dtext");
    if (!payload.link) missing.push("link");

    if (missing.length) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: `Missing: ${missing.join(", ")}` });
    }

    // optional footerId - validate and ensure Footer exists
    let footerId;
    if (typeof req.body.footerId !== "undefined") {
      footerId = norm(req.body.footerId);
      if (!footerId) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "footerId cannot be empty if provided" });
      }
      if (!isValidObjectId(footerId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid footerId" });
      }
      const footerExists = await Footer.findById(footerId).session(session).lean();
      if (!footerExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced Footer not found" });
      }
      payload.footerId = footerId;
    }

    // create using new + save (inside transaction)
    const fact = new Factaddress(payload);
    await fact.save({ session });

    // if footerId provided, push into Footer.factoryaddress array (avoid duplicates)
    if (footerId) {
      await Footer.findByIdAndUpdate(
        footerId,
        { $addToSet: { factoryaddress: fact._id } }, // addToSet avoids duplicates
        { session }
      );
    }

    await session.commitTransaction();

    // non-transactional read/populate after commit
    const result = await Factaddress.findById(fact._id).populate("footerId");
    return res.status(201).json({ success: true, message: "Factaddress created", data: result });
  } catch (err) {
    try {
      if (session.inTransaction()) await session.abortTransaction();
    } catch (abortErr) {
      console.error("abortTransaction error:", abortErr);
    }
    console.error("createFactaddress error:", err);
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
 * GET /api/v1/factaddress
 * List all factaddresses (populates footerId).
 */
export const getFactaddress = async (req, res) => {
  try {
    const items = await Factaddress.find({}).sort({ createdAt: -1 }).populate("footerId");
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    console.error("listFactaddresses error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/factaddress/latest
 * GET /api/v1/factaddress/:id
 */


/**
 * PATCH /api/v1/factaddress/update/:id
 * - Partial updates allowed.
 * - If footerId is changed, maintain Footer.factoryaddress arrays (pull from old, addToSet on new).
 */
export const updateFactaddress = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Factaddress ID required" });
    }
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid Factaddress ID" });
    }

    const existing = await Factaddress.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Factaddress not found" });
    }

    const setPayload = {};

    if (typeof req.body.Htext !== "undefined") {
      const v = norm(req.body.Htext);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Htext cannot be empty" });
      }
      setPayload.Htext = v;
    }

    if (typeof req.body.Dtext !== "undefined") {
      const v = norm(req.body.Dtext);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Dtext cannot be empty" });
      }
      setPayload.Dtext = v;
    }

    if (typeof req.body.link !== "undefined") {
      const v = norm(req.body.link);
      if (!v) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "link cannot be empty" });
      }
      setPayload.link = v;
    }

    let newFooterId;
    if (typeof req.body.footerId !== "undefined") {
      const footerId = norm(req.body.footerId);
      if (!footerId) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "footerId cannot be empty if provided" });
      }
      if (!isValidObjectId(footerId)) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(400).json({ success: false, message: "Invalid footerId" });
      }
      const footerExists = await Footer.findById(footerId).session(session).lean();
      if (!footerExists) {
        if (session.inTransaction()) await session.abortTransaction();
        return res.status(404).json({ success: false, message: "Referenced Footer not found" });
      }
      newFooterId = footerId;
      setPayload.footerId = newFooterId;
    }

    if (Object.keys(setPayload).length === 0) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "No fields provided to update" });
    }

    const updatedFact = await Factaddress.findByIdAndUpdate(id, { $set: setPayload }, { new: true, runValidators: true, session });

    // If footerId changed, update Footer.factoryaddress arrays
    if (typeof newFooterId !== "undefined") {
      // remove this fact id from previous footer.factoryaddress if present and different
      if (existing.footerId && existing.footerId.toString() !== newFooterId.toString()) {
        await Footer.findByIdAndUpdate(existing.footerId, { $pull: { factoryaddress: updatedFact._id } }, { session });
      }
      // ensure new footer contains this fact id
      await Footer.findByIdAndUpdate(newFooterId, { $addToSet: { factoryaddress: updatedFact._id } }, { session });
    }

    await session.commitTransaction();

    const result = await Factaddress.findById(updatedFact._id).populate("footerId");
    return res.status(200).json({ success: true, message: "Factaddress updated", data: result });
  } catch (err) {
    try {
      if (session.inTransaction()) await session.abortTransaction();
    } catch (abortErr) {
      console.error("abortTransaction error:", abortErr);
    }
    console.error("updateFactaddress error:", err);
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
 * DELETE /api/v1/factaddress/delete/:id
 * - Pulls the fact id from any Footer.factoryaddress arrays that reference it.
 */
export const deleteFactaddress = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const { id } = req.params;
    if (!id) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Factaddress ID required" });
    }
    if (!isValidObjectId(id)) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(400).json({ success: false, message: "Invalid Factaddress ID" });
    }

    const existing = await Factaddress.findById(id).session(session);
    if (!existing) {
      if (session.inTransaction()) await session.abortTransaction();
      return res.status(404).json({ success: false, message: "Factaddress not found" });
    }

    // pull this fact address id from any footers' factoryaddress arrays
    if (existing.footerId) {
      await Footer.findByIdAndUpdate(existing.footerId, { $pull: { factoryaddress: existing._id } }, { session });
    } else {
      // ensure we remove from any Footer that might reference this Factaddress (safety)
      await Footer.updateMany({ factoryaddress: existing._id }, { $pull: { factoryaddress: existing._id } }, { session });
    }

    await Factaddress.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    return res.status(200).json({ success: true, message: "Factaddress deleted" });
  } catch (err) {
    try {
      if (session.inTransaction()) await session.abortTransaction();
    } catch (abortErr) {
      console.error("abortTransaction error:", abortErr);
    }
    console.error("deleteFactaddress error:", err);
    return res.status(500).json({ success: false, message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};
