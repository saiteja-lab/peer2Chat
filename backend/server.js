import express from "express";
import dotenv from "dotenv";
import cors from 'cors'
import userRoutes from "./routes/userRoutes.js";
import authRouter from './routes/auth.js'
import chatRoutes from './routes/chatRoutes.js'
import http from 'http'
import setUpSocket from "./socket/socket.js";
dotenv.config();

const app = express();
const server = http.createServer(app)

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
app.use('/api/auth', authRouter)
app.use("/api/users", userRoutes);
app.use('/api/chat', chatRoutes)

// // Initialize Socket.io
setUpSocket(server)

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
