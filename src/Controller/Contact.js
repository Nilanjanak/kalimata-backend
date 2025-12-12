import mongoose from "mongoose";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { Contact } from "../Model/Contact.js";

dotenv.config();
// ============================
// Create new enquiry
// ============================
export const createContact = async (req, res)=>{

    try{
        const {name,email,phone,message} = req.body;
        if(!name||name.trim() === "" 
        || !phone||phone.trim()===""
        || !email||email.trim()===""
        ||!message|| message.trim()===""){
             return res.status(400).json({ error: "Please fill all fields" });
        }
    let contact = new Contact({
       name,email,phone, message
    });

    await contact.save();

    if(!contact){
        return res.status(500).json({
        error: "Enquiry creation failed",
      });
    }
            // Email configuration
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `${email}`,
      to: "kalimatagroup908@gmail.com",
      subject: `New  Contact Received from ${name}`,
      html: `
        <h3>Contact Details</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Enquiry:</strong> ${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({
      message: "Contact created and email sent successfully",
      contact,
    });
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
}

// Get all contact submissions
export const getContact = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 }); // newest first

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
      message: "Contact data fetched successfully",
    });
  } catch (err) {
    console.error("getContact error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
