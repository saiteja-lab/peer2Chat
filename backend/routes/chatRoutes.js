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
  createGroup,
  getUserGroups,
  sendGroupMessage,
  getGroupMessages,
  deleteGroupMessage,
} from '../controller/chatController.js';

const router = express.Router();

// Direct Chat Routes
router.post('/session', createOrGetChatSession);
router.post('/message', sendMessage);
router.get('/messages/:sessionId', getMessages);
router.put('/messages/:sessionId/read', markMessagesAsRead);
router.delete('/messages/:sessionId', deleteMessage);
router.get('/sessions/:userId', getUserChatSessions);
router.post('/friends', getFriends);
router.post('/addFriends', addFriends);
router.get('/unread/:userId', getUnreadCounts);

// Group Chat Routes
router.post('/group/create', createGroup);
router.get('/group/user/:userId', getUserGroups);
router.post('/group/message', sendGroupMessage);
router.get('/group/:groupId/messages', getGroupMessages);
router.delete('/group/:groupId/message', deleteGroupMessage);

export default router;