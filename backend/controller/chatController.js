
import { db } from "../firebase/firebaseConfig.js";
import { FieldValue } from "firebase-admin/firestore";
import { getIO } from "../socket/socket.js";

/**
 * Validates user IDs
 */
const validateUserId = (userId) => {
  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    throw new Error("Invalid user ID");
  }
  return userId.trim();
};

/**
 * Check if a user exists in the database
 */
const checkUserExists = async (userId) => {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();
  return userDoc.exists;
};

/**
 * Check if multiple users exist in the database
 */
const checkUsersExist = async (userIds) => {
  const checks = await Promise.all(
    userIds.map(async (userId) => ({
      userId,
      exists: await checkUserExists(userId),
    }))
  );
  return checks;
};

/**
 * Generates a consistent session ID from two user IDs
 */
const generateSessionId = (user1, user2) => {
  const id1 = validateUserId(user1);
  const id2 = validateUserId(user2);
  
  if (id1 === id2) {
    throw new Error("Cannot create chat session with the same user");
  }
  
  return id1 < id2 ? `${id1}_${id2}` : `${id2}_${id1}`;
};

/**
 * Create or get existing chat session between two users
 */
export const createOrGetChatSession = async (req, res) => {
  try {
    const { user1, user2 } = req.body;

    // Validate input
    if (!user1 || !user2) {
      return res.status(400).json({ 
        error: "Both user1 and user2 are required" 
      });
    }

    // Check if both users exist
    const userChecks = await checkUsersExist([user1, user2]);
    const nonExistentUsers = userChecks
      .filter(check => !check.exists)
      .map(check => check.userId);

    if (nonExistentUsers.length > 0) {
      return res.status(404).json({ 
        error: "One or more users do not exist",
        nonExistentUsers: nonExistentUsers
      });
    }

    const sessionId = generateSessionId(user1, user2);
    const chatRef = db.collection("chats").doc(sessionId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      await chatRef.set({
        participants: [user1, user2],
        createdAt: FieldValue.serverTimestamp(),
        lastMessageAt: FieldValue.serverTimestamp(),
        messageCount: 0,
      });
    }

    res.status(200).json({ 
      sessionId,
      exists: chatDoc.exists 
    });
  } catch (err) {
    console.error("Error in createOrGetChatSession:", err);
    res.status(500).json({ 
      error: "Failed to create or retrieve chat session",
      details: err.message 
    });
  }
};

/**
 * Send message
 */
export const sendMessage = async (req, res) => {
  try {
    const { sessionId, sender, message } = req.body;

    // Validate input
    if (!sessionId || !sender || !message) {
      return res.status(400).json({ 
        error: "sessionId, sender, and message are required" 
      });
    }

    if (typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ 
        error: "Message cannot be empty" 
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({ 
        error: "Message exceeds maximum length of 5000 characters" 
      });
    }

    // Check if sender exists
    const senderExists = await checkUserExists(sender);
    if (!senderExists) {
      return res.status(404).json({ 
        error: "Sender does not exist" 
      });
    }

    const chatRef = db.collection("chats").doc(sessionId);
    const chatDoc = await chatRef.get();

    // Verify chat session exists
    if (!chatDoc.exists) {
      return res.status(404).json({ 
        error: "Chat session not found" 
      });
    }

    // Verify sender is a participant
    const participants = chatDoc.data().participants || [];
    if (!participants.includes(sender)) {
      return res.status(403).json({ 
        error: "Sender is not a participant in this chat" 
      });
    }

    const messagesRef = chatRef.collection("messages");

    // Add message and update chat metadata in a batch
    const batch = db.batch();
    
    const newMessageRef = messagesRef.doc();
    batch.set(newMessageRef, {
      sender,
      message: message.trim(),
      timestamp: FieldValue.serverTimestamp(),
      read: false,
      deleted: false,
    });

    batch.update(chatRef, {
      lastMessageAt: FieldValue.serverTimestamp(),
      lastMessage: message.trim().substring(0, 100), // Preview
      lastSender: sender,
      messageCount: FieldValue.increment(1),
    });

    await batch.commit();

    // Emit to session room so connected clients receive it in real-time
    const io = getIO?.();
    if (io) {
      io.to(sessionId).emit("receiveMessage", {
        sessionId,
        messageId: newMessageRef.id,
        sender,
        message: message.trim(),
      });

      // Also emit to recipient's user room to update unread count in realtime
      try {
        const participants = chatDoc.data().participants || [];
        const recipient = participants.find((p) => p !== sender);
        if (recipient) {
          io.to(String(recipient)).emit("unreadIncrement", {
            from: sender,
            sessionId,
          });
        }
      } catch (_) {}
    }

    res.status(200).json({ 
      success: true, 
      message: "Message sent successfully",
      messageId: newMessageRef.id 
    });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    res.status(500).json({ 
      error: "Failed to send message",
      details: err.message 
    });
  }
};

/**
 * Fetch messages for a session with pagination
 */
export const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 10, lastMessageId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ error: "Limit must be between 1 and 100" });
    }

    const chatRef = db.collection("chats").doc(sessionId);
    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    // Query latest messages in descending order for efficient pagination of older messages
    let q = chatRef.collection("messages").orderBy("timestamp", "desc").limit(parsedLimit);

    if (lastMessageId) {
      const cursorDoc = await chatRef.collection("messages").doc(lastMessageId).get();
      if (cursorDoc.exists) {
        q = q.startAfter(cursorDoc);
      }
    }

    const snap = await q.get();
    const docs = snap.docs;

    // nextCursor is the last doc in this descending page (oldest among the page)
    const nextCursor = docs.length > 0 ? docs[docs.length - 1].id : null;
    const hasMore = docs.length === parsedLimit;

    // Return messages in ascending order for UI rendering
    const messages = docs
      .map((doc) => ({ id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate?.() || null }))
      .reverse();

    return res.status(200).json({ messages, count: messages.length, hasMore, nextCursor });
  } catch (err) {
    console.error("Error in getMessages:", err);
    return res.status(500).json({ error: "Failed to fetch messages", details: err.message });
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId, messageIds } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({ 
        error: "sessionId and userId are required" 
      });
    }

    // Check if user exists
    const userExists = await checkUserExists(userId);
    if (!userExists) {
      return res.status(404).json({ 
        error: "User does not exist" 
      });
    }

    const chatRef = db.collection("chats").doc(sessionId);
    const chatDoc = await chatRef.get();

    // Verify chat session exists
    if (!chatDoc.exists) {
      return res.status(404).json({ 
        error: "Chat session not found" 
      });
    }

    // Verify user is a participant
    const participants = chatDoc.data().participants || [];
    if (!participants.includes(userId)) {
      return res.status(403).json({ 
        error: "User is not a participant in this chat" 
      });
    }

    const messagesRef = chatRef.collection("messages");

    // Build query to update unread messages
    let query = messagesRef
      .where("read", "==", false)
      .where("sender", "!=", userId);

    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      // If specific message IDs provided, update only those
      const batch = db.batch();
      messageIds.forEach(id => {
        batch.update(messagesRef.doc(id), { 
          read: true,
          readAt: FieldValue.serverTimestamp() 
        });
      });
      await batch.commit();
    } else {
      // Otherwise update all unread messages
      const snapshot = await query.get();
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { 
          read: true,
          readAt: FieldValue.serverTimestamp() 
        });
      });
      await batch.commit();
    }

    const io = getIO?.();
    if (io) {
      io.to(sessionId).emit("messagesMarkedRead", {
        sessionId,
        userId,
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Messages marked as read" 
    });
  } catch (err) {
    console.error("Error in markMessagesAsRead:", err);
    res.status(500).json({ 
      error: "Failed to mark messages as read",
      details: err.message 
    });
  }
};

/**
 * Get user's chat sessions
 */
export const getUserChatSessions = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        error: "userId is required" 
      });
    }

    // Check if user exists
    const userExists = await checkUserExists(userId);
    if (!userExists) {
      return res.status(404).json({ 
        error: "User does not exist" 
      });
    }

    const chatsSnapshot = await db
      .collection("chats")
      .where("participants", "array-contains", userId)
      .orderBy("lastMessageAt", "desc")
      .get();

    const sessions = chatsSnapshot.docs.map(doc => ({
      sessionId: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || null,
      lastMessageAt: doc.data().lastMessageAt?.toDate?.() || null,
    }));

    res.status(200).json({ sessions });
  } catch (err) {
    console.error("Error in getUserChatSessions:", err);
    res.status(500).json({ 
      error: "Failed to fetch chat sessions",
      details: err.message 
    });
  }
};


// Get a user's friends
export const getFriends = async (req, res) => {
  try {
    const { user } = req.body;

    if (!user) {
      return res.status(400).json({ message: "User not provided" });
    }

    const friendsRef = db.collection("friends").doc(user).collection("list");
    const snapshot = await friendsRef.get();

    if (snapshot.empty) {
      return res.status(200).json({ friends: [] });
    }

    const friends = snapshot.docs.map(doc => doc.id);
    return res.status(200).json({ friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Add two users as friends (mutual friendship)
export const addFriends = async (req, res) => {
  try {
    const { user1, user2 } = req.body;

    if (!user1 || !user2) {
      return res.status(400).json({ message: "Both users are required" });
    }

    // Check if both users exist
    const userChecks = await checkUsersExist([user1, user2]);
    const nonExistentUsers = userChecks
      .filter(check => !check.exists)
      .map(check => check.userId);

    if (nonExistentUsers.length > 0) {
      return res.status(404).json({
        message: "User not found",
        nonExistentUsers,
      });
    }

    const user1FriendRef = db
      .collection("friends")
      .doc(user1)
      .collection("list")
      .doc(user2);
    const user2FriendRef = db
      .collection("friends")
      .doc(user2)
      .collection("list")
      .doc(user1);

    // Add each other as friends (mutual)
    await user1FriendRef.set({ createdAt: FieldValue.serverTimestamp() });
    await user2FriendRef.set({ createdAt: FieldValue.serverTimestamp() });

    return res.status(200).json({ message: "Friends added successfully" });
  } catch (error) {
    console.error("Error adding friends:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userName, message } = req.body;

    if (!sessionId || !userName || !message) {
      return res.status(400).json({
        error: "sessionId, userName, and message are required",
      });
    }

    const chatRef = db.collection("chats").doc(sessionId);
    const chatDoc = await chatRef.get();

    if (!chatDoc.exists) {
      return res.status(404).json({ error: "Chat session not found" });
    }

    const participants = chatDoc.data().participants || [];
    if (!participants.includes(userName)) {
      return res.status(403).json({ error: "User is not a participant in this chat" });
    }

    const messagesRef = chatRef.collection("messages");
    const snapshot = await messagesRef
      .where("sender", "==", userName)
      .where("message", "==", message)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "No matching message found to delete" });
    }

    let targetDoc = snapshot.docs[0];
    if (snapshot.docs.length > 1) {
      targetDoc = snapshot.docs
        .slice()
        .sort((a, b) => {
          const ta = a.data().timestamp?.toMillis?.() || 0;
          const tb = b.data().timestamp?.toMillis?.() || 0;
          return tb - ta;
        })[0];
    }

    // Persist soft delete flag instead of removing the document
    await targetDoc.ref.update({
      deleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy: userName,
    });

    // Do not decrement messageCount; it represents total sent messages

    const io = getIO?.();
    if (io) {
      io.to(sessionId).emit("messageDeleted", {
        sessionId,
        messageId: targetDoc.id,
        sender: userName,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      messageId: targetDoc.id,
    });
  } catch (err) {
    console.error("Error in deleteMessage:", err);
    return res.status(500).json({
      error: "Failed to delete message",
      details: err.message,
    });
  }
};

export const getUnreadCounts = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const userExists = await checkUserExists(userId);
    if (!userExists) {
      return res.status(404).json({ error: "User does not exist" });
    }

    const friendsRef = db.collection("friends").doc(userId).collection("list");
    const friendsSnap = await friendsRef.get();
    if (friendsSnap.empty) {
      return res.status(200).json({ counts: {} });
    }

    const friendIds = friendsSnap.docs.map((d) => d.id);

    const results = await Promise.all(
      friendIds.map(async (fid) => {
        const sessionId = generateSessionId(userId, fid);
        const chatRef = db.collection("chats").doc(sessionId);
        const chatDoc = await chatRef.get();
        if (!chatDoc.exists) return { fid, count: 0 };
        const unreadSnap = await chatRef
          .collection("messages")
          .where("read", "==", false)
          .where("sender", "!=", userId)
          .get();
        return { fid, count: unreadSnap.size };
      })
    );

    const counts = results.reduce((acc, { fid, count }) => {
      acc[fid] = count;
      return acc;
    }, {});

    return res.status(200).json({ counts });
  } catch (err) {
    console.error("Error in getUnreadCounts:", err);
    return res.status(500).json({ error: "Failed to fetch unread counts", details: err.message });
  }
};
