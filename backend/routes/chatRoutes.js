
import express from 'express';
import {
  createOrGetChatSession,
  sendMessage,
  getMessages,
  markMessagesAsRead,
  getUserChatSessions,
  getFriends,
  addFriends,
  deleteMessage,
  getUnreadCounts,
} from '../controller/chatController.js';

const router = express.Router();

// Routes
router.post('/session', createOrGetChatSession);
router.post('/message', sendMessage);
router.get('/messages/:sessionId', getMessages);
router.put('/messages/:sessionId/read', markMessagesAsRead);
router.delete('/messages/:sessionId', deleteMessage);
router.get('/sessions/:userId', getUserChatSessions);
router.post('/friends', getFriends)
router.post('/addFriends', addFriends)
router.get('/unread/:userId', getUnreadCounts)

export default router;