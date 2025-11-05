// backend/socket/socket.js
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";
let ioRef = null;
export const getIO = () => ioRef;

const setupSocket = (server) => {
  ioRef = new Server(server, {
    cors: {
      origin: allowedOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  ioRef.on("connection", (socket) => {
    console.log("✅ Socket connected:", socket.id);

    socket.on("join", (userId) => {
      if (!userId) return;
      try {
        socket.join(String(userId));
      } catch (_) {}
    });

    socket.on("joinSession", (sessionId) => {
      if (!sessionId) return;
      socket.join(sessionId);
      // console.log(`Socket ${socket.id} joined session ${sessionId}`);
    });

    socket.on("leaveSession", (sessionId) => {
      if (!sessionId) return;
      socket.leave(sessionId);
    });

    // Do not relay 'sendMessage' here; the HTTP controller will emit authoritative events

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected:", socket.id);
    });
  });
};

export default setupSocket;
