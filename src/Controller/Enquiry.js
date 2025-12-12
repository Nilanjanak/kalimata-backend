import mongoose from "mongoose";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { Enquiry } from "../Model/Enquiry.js";

dotenv.config();

/* ---------------------------------------------------------
   CREATE NEW ENQUIRY
--------------------------------------------------------- */
export const createEnquiry = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!name || !email || !phone || !message) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Save enquiry
    const enquiry = new Enquiry({
      name,
      email,
      phone,
      enquirie: message, // important: matches schema field
    });

    await enquiry.save();

    /* Email Notification (Non-blocking) */
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465, 
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === "production",
      },
    });

    const mailOptions = {
      from: email,
      to: process.env.NOTIFY_EMAIL || "kalimatagroup908@gmail.com",
      subject: `New Enquiry from ${name}`,
      html: `
        <h3>New Enquiry Received</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    // Non-fatal email send
    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error("Email failed (not blocking):", mailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "Enquiry submitted successfully",
      data: enquiry,
    });
  } catch (err) {
    console.error("createEnquiry error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};

/* ---------------------------------------------------------
   GET ALL ENQUIRIES
--------------------------------------------------------- */
export const getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
      message: "Enquiries fetched successfully",
    });
  } catch (err) {
    console.error("getAllEnquiries error:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }
};
