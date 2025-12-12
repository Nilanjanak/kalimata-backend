import express from "express";
import {createContact, getContact } from "../Controller/Contact.js";

const ContactRouter = express.Router();

// PUBLIC
ContactRouter.route("/")
.post(createContact)
.get (getContact);


export default ContactRouter;
