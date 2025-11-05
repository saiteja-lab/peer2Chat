import { io } from "socket.io-client";

let socket = null;

const getBaseUrl = () => {
  const fromEnv = import.meta?.env?.VITE_SOCKET_URL || import.meta?.env?.VITE_BACKEND_URL;
  return fromEnv || "http://localhost:5000";
};

const resolveUserName = (u) => {
  if (!u) return "";
  if (typeof u === "string") return u;
  return (
    u.userName || u.username || u.user || u.name || u.id || ""
  );
};

export const getSocket = () => socket;

export const connectSocket = (user) => {
  if (socket?.connected) return socket;

  const userName = resolveUserName(user);

  socket = io(getBaseUrl(), {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: userName ? { user: userName } : undefined,
  });

  socket.on("connect", () => {
    if (userName) socket.emit("join", userName);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  try {
    socket.removeAllListeners();
    socket.disconnect();
  } finally {
    socket = null;
  }
};

export const onReceiveMessage = (handler) => {
  if (!socket) return () => {};
  socket.on("receiveMessage", handler);
  return () => socket.off("receiveMessage", handler);
};

export const sendMessage = ({ sessionId, sender, message }) => {
  if (!socket) return;
  socket.emit("sendMessage", { sessionId, sender, message });
};

export const on = (event, handler) => {
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => socket.off(event, handler);
};

export const emit = (event, payload) => {
  if (!socket) return;
  socket.emit(event, payload);
};


