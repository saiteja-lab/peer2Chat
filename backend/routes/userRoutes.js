
import express from "express";
import { db } from "../firebase/firebaseConfig.js";

const router = express.Router();
const usersCollection = db.collection("users");

// CREATE user (userName as doc ID)
router.post("/", async (req, res) => {
  try {
    const { userName, email, ...rest } = req.body;

    if (!userName || !email) {
      return res.status(400).json({ message: "userName and email are required" });
    }

    // Check if this userName already exists
    const userRef = usersCollection.doc(userName);
    const existingUser = await userRef.get();

    if (existingUser.exists) {
      return res.status(400).json({ message: "UserName already exists" });
    }

    // Check if email already exists (email must be unique)
    const emailSnap = await usersCollection.where("email", "==", email).get();
    if (!emailSnap.empty) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const newUser = { userName, email, ...rest, createdAt: new Date().toISOString() };
    await userRef.set(newUser);

    res.status(201).json({ message: "User created successfully", ...newUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ all users
router.get("/", async (req, res) => {
  try {
    const snapshot = await usersCollection.get();
    const users = snapshot.docs.map(doc => doc.data());
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// READ single user by userName
router.get("/:userName", async (req, res) => {
  try {
    const userRef = usersCollection.doc(req.params.userName);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(doc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE user
router.put("/:userName", async (req, res) => {
  try {
    const { email, ...rest } = req.body;
    const userRef = usersCollection.doc(req.params.userName);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent duplicate emails
    if (email && email !== doc.data().email) {
      const emailSnap = await usersCollection.where("email", "==", email).get();
      if (!emailSnap.empty) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    await userRef.update({ email, ...rest, updatedAt: new Date().toISOString() });
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE user by userName
router.delete("/:userName", async (req, res) => {
  try {
    const userRef = usersCollection.doc(req.params.userName);
    const doc = await userRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    await userRef.delete();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
