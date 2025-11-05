
import express from "express";
import { db } from "../firebase/firebaseConfig.js";
import crypto from "crypto"; // for OTP generation
import sendOtp from "../utils/mailer.js"
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const router = express.Router();
const usersCollection = db.collection("users");

// Generate random 6-digit OTP
const generateRandomOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateToken = (user) => {
  return jwt.sign(
    { userName: user.userName, email: user.email },
    process.env.JWT_SECRET || "mysecretkey",
    { expiresIn: "1h" }
  );
};



// REGISTER USER
export const register = async (req, res) => {
  try {
    const { userName, email, password } = req.body;

    if (!userName || !email || !password) {
      return res.status(400).json({ message: "userName, email and password are required" });
    }

    const userRef = usersCollection.doc(userName);
    const existingUser = await userRef.get();
    if (existingUser.exists) {
      return res.status(400).json({ message: "UserName already exists" });
    }

    const emailSnap = await usersCollection.where("email", "==", email).get();
    if (!emailSnap.empty) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const otp = generateRandomOtp();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes validity

    const newUser = {
      userName,
      email,
      // never store plaintext password
      hashedPassword: hashedPassword,
      createdAt: new Date().toISOString(),
      verified: false,
      otp,
      otpExpiry
    };

    await userRef.set(newUser);
    let emailSent = true;
    try {
      await sendOtp(email, otp);
    } catch (e) {
      emailSent = false;
      console.warn("Registration OTP generated but email failed to send:", e?.message || e);
    }

    console.log(`OTP for ${email} is ${otp}`);

    const token = generateToken({ userName, email });

    res.status(201).json({
      message: emailSent ? "User created successfully. Verify OTP sent to your email." : "User created. OTP generated, but email could not be sent in this environment.",
      token,
      userName,
      otp,
      emailSent
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error in register controller" });
  }
};

// GENERATE NEW OTP (Resend OTP)
export const generateOtp = async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName) return res.status(400).json({ message: "userName is required" });

    const userRef = usersCollection.doc(userName);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = generateRandomOtp();
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    await userRef.update({ otp, otpExpiry });
    await sendOtp(userDoc.data().email, otp);

    console.log(`Resent OTP for ${userDoc.data().email} is ${otp}`);

    res.status(200).json({ message: "New OTP generated and sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating OTP" });
  }
};

// VERIFY OTP
export const verifyOtp = async (req, res) => {
  try {
    const { userName, otp } = req.body;

    if (!userName || !otp) {
      return res.status(400).json({ message: "userName and otp are required" });
    }

    const userRef = usersCollection.doc(userName);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    if (userData.verified) {
      return res.status(400).json({ message: "User already verified" });
    }

    if (Date.now() > userData.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (userData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    await userRef.update({
      verified: true,
      otp: null,
      otpExpiry: null
    });

    res.status(200).json({ message: "User verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};
// ========================== LOGIN ==========================
export const login = async (req, res) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ message: "userName and password are required" });
    }

    const userRef = usersCollection.doc(userName);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    const isValid = await bcrypt.compare(password, userData.hashedPassword || "");
    if (!isValid){
      return res.status(400).json({message: "Incorrect password"})
    }

    if (!userData.verified) {
      return res.status(403).json({ message: "User not verified. Please verify your email." });
    }

    const token = generateToken(userData);

    res.status(200).json({
      message: "Login successful",
      token,
      userName
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error logging in" });
  }
};

// ==================== FORGOT PASSWORD (Request OTP) ====================
export const requestPasswordReset = async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName) return res.status(400).json({ message: "userName is required" });

    const userRef = usersCollection.doc(userName);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const userData = userDoc.data();
    if (!userData.verified) return res.status(403).json({ message: "User not verified" });

    const otp = generateRandomOtp();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    await userRef.update({ otp, otpExpiry });

    let emailSent = true;
    try {
      await sendOtp(userData.email, otp);
    } catch (e) {
      emailSent = false;
      console.warn("Password reset OTP generated but email failed to send:", e?.message || e);
    }

    console.log(`Password reset OTP for ${userData.email}: ${otp}`);
    return res.status(200).json({ message: emailSent ? "OTP sent to your email" : "OTP generated. Email send failed in this environment.", emailSent });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error initiating password reset" });
  }
};

// ==================== RESET PASSWORD (Verify OTP + Update) ====================
export const resetPassword = async (req, res) => {
  try {
    const { userName, otp, newPassword } = req.body;
    if (!userName || !otp || !newPassword) {
      return res.status(400).json({ message: "userName, otp and newPassword are required" });
    }

    const userRef = usersCollection.doc(userName);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const userData = userDoc.data();

    if (!userData.otp || !userData.otpExpiry) {
      return res.status(400).json({ message: "No reset request found or OTP already used" });
    }

    if (Date.now() > userData.otpExpiry) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (String(userData.otp) !== String(otp)) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await userRef.update({ hashedPassword, otp: null, otpExpiry: null });

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error resetting password" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName) return res.status(400).json({ message: "userName is required" });

    const userRef = usersCollection.doc(userName);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const { hashedPassword, otp, otpExpiry, ...safe } = userDoc.data();
    return res.status(200).json(safe);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error fetching profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userName, email, fullName, bio, avatar } = req.body;
    if (!userName) return res.status(400).json({ message: "userName is required" });

    const userRef = usersCollection.doc(userName);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const updates = {};

    if (email && email !== userDoc.data().email) {
      const emailSnap = await usersCollection.where("email", "==", email).get();
      if (!emailSnap.empty) {
        return res.status(400).json({ message: "Email already exists" });
      }
      updates.email = email;
    }

    if (typeof fullName === "string") updates.fullName = fullName;
    if (typeof bio === "string") updates.bio = bio;
    if (typeof avatar === "string") updates.avatar = avatar; // URL or base64

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    await userRef.update(updates);
    const { hashedPassword, otp, otpExpiry, ...safe } = (await userRef.get()).data();
    return res.status(200).json({ message: "Profile updated", user: safe });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error updating profile" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userName, currentPassword, newPassword } = req.body;
    if (!userName || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "userName, currentPassword and newPassword are required" });
    }

    const userRef = usersCollection.doc(userName);
    const userDoc = await userRef.get();
    if (!userDoc.exists) return res.status(404).json({ message: "User not found" });

    const userData = userDoc.data();
    const valid = await bcrypt.compare(currentPassword, userData.hashedPassword || "");
    if (!valid) return res.status(400).json({ message: "Current password is incorrect" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await userRef.update({ hashedPassword });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error changing password" });
  }
};


export default router;
