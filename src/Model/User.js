import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SCHEMA } from "../Utils/Constant.js";
const Saltround = Number(process.env.SALT_ROUNDS) || 10;
console.log("Salt rounds set to:", Saltround);
const UserSchema = new SCHEMA(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  { timestamps: true }
);
// pre-save timestamp
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, Saltround);
});
// Method to compare entered password with the hashed password in the database
UserSchema.methods.comparePassword = async function (enteredPassword) {
  console.log("Comparing passwords:", enteredPassword, this.password);
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate the JWT token for the authentication
UserSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.EXPIRY_TIME || "1d",
    }
  );
};

export const User =mongoose.model("User", UserSchema);