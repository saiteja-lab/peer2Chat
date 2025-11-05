import { createSlice } from "@reduxjs/toolkit";
import api from "../services/api";
import { authService } from "../services/authService";
import { chatService } from "../services/chatService";

// --- Chat Slice Definition ---
const chatSlice = createSlice({
  name: "chat",
  initialState: {
    friends: [],
    messages: {}, // { friendName: [message1, message2...] }
    cursors: {}, // { friendName: { nextCursor, hasMore } }
    unreadCounts: {}, // { friendName: number }
    activeFriend: null,
    user2: null, // selected chat counterpart's username
    activeSessionId: null,
    loading: false,
    friendsLoading: false,
    chatLoading: false,
    error: null,
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setFriendsLoading: (state, action) => {
      state.friendsLoading = action.payload;
    },
    setChatLoading: (state, action) => {
      state.chatLoading = action.payload;
    },
    setFriends: (state, action) => {
      state.friends = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setActiveFriend: (state, action) => {
      state.activeFriend = action.payload;
    },
    setUser2: (state, action) => {
      state.user2 = action.payload;
    },
    setActiveSessionId: (state, action) => {
      state.activeSessionId = action.payload;
    },
    setMessagesForFriend: (state, action) => {
      const { friendName, messages } = action.payload;
      state.messages[friendName] = messages;
    },
    prependMessagesForFriend: (state, action) => {
      const { friendName, older } = action.payload || {};
      if (!friendName || !Array.isArray(older)) return;
      const current = state.messages[friendName] || [];
      state.messages[friendName] = [...older, ...current];
    },
    setCursorForFriend: (state, action) => {
      const { friendName, nextCursor, hasMore } = action.payload || {};
      if (!friendName) return;
      state.cursors[friendName] = { nextCursor: nextCursor || null, hasMore: !!hasMore };
    },
    receiveMessage: (state, action) => {
      const { senderId, message } = action.payload;
      if (!state.messages[senderId]) state.messages[senderId] = [];
      state.messages[senderId].push(message);
    },
    sendMessageLocal: (state, action) => {
      const { friendId, message } = action.payload;
      if (!state.messages[friendId]) state.messages[friendId] = [];
      state.messages[friendId].push(message);
    },
    clearChat: (state) => {
      state.friends = [];
      state.messages = {};
      state.unreadCounts = {};
      state.activeFriend = null;
      state.error = null;
    },
    setUnreadCounts: (state, action) => {
      state.unreadCounts = action.payload || {};
    },
    setUnreadForFriend: (state, action) => {
      const { friendName, count } = action.payload || {};
      if (!friendName) return;
      state.unreadCounts[friendName] = Math.max(0, Number(count || 0));
    },
    incrementUnreadForFriend: (state, action) => {
      const friendName = action.payload;
      if (!friendName) return;
      state.unreadCounts[friendName] = (state.unreadCounts[friendName] || 0) + 1;
    },
    clearUnreadForFriend: (state, action) => {
      const friendName = action.payload;
      if (!friendName) return;
      state.unreadCounts[friendName] = 0;
    },
  },
});

export const {
  setLoading,
  setFriendsLoading,
  setChatLoading,
  setFriends,
  setError,
  setActiveFriend,
  setUser2,
  setActiveSessionId,
  setMessagesForFriend,
  receiveMessage,
  sendMessageLocal,
  clearChat,
  setUnreadCounts,
  setUnreadForFriend,
  incrementUnreadForFriend,
  clearUnreadForFriend,
  prependMessagesForFriend,
  setCursorForFriend,
} = chatSlice.actions;

export default chatSlice.reducer;

// --- Async Thunk: Fetch Friends ---
export const fetchFriends = () => async (dispatch, getState) => {
  try {
    dispatch(setFriendsLoading(true));

    const state = getState();
    const token = state.auth.token;
    const authUser = state.auth.currentUser;
    const userName = (typeof authUser === 'object' && (authUser?.userName || authUser?.username)) || authUser;

    if (!userName || typeof userName !== 'string') {
      throw new Error("User not logged in or username missing");
    }

    const res = await api.post(
      "/api/chat/friends",
      { user: userName },
    );

    const friendsData = (res.data.friends || []).map((name, index) => ({
      id: index + 1,
      userName: name,
    }));

    const friendsWithAvatars = await Promise.all(
      friendsData.map(async (f) => {
        try {
          const prof = await authService.getProfile(f.userName);
          return { ...f, avatar: prof?.avatar || null };
        } catch (_) {
          return { ...f, avatar: null };
        }
      })
    );

    dispatch(setFriends(friendsWithAvatars));

    // Fetch initial unread counts after friends are loaded
    await dispatch(fetchUnreadCounts());
  } catch (error) {
    console.error("❌ Error fetching friends:", error);
    const message =
      error.response?.data?.message || error.message || "Failed to load friends";
    dispatch(setError(message));
  } finally {
    dispatch(setFriendsLoading(false));
  }
};

export const fetchUnreadCounts = () => async (dispatch, getState) => {
  try {
    const state = getState();
    const authUser = state.auth.currentUser;
    const userName = (typeof authUser === 'object' && (authUser?.userName || authUser?.username)) || authUser;
    if (!userName) return;
    const counts = await chatService.getUnreadCounts(userName);
    dispatch(setUnreadCounts(counts));
  } catch (error) {
    // non-fatal
    console.warn('Failed to fetch unread counts', error?.message || error);
  }
};

// Helper to resolve current username string from auth state
const resolveCurrentUserName = (state) => {
  const authUser = state.auth.currentUser;
  return (typeof authUser === 'object' && (authUser?.userName || authUser?.username)) || authUser;
}

// Select a friend: set user2, create/get session, and load messages
export const selectFriendAndLoadChat = (friend) => async (dispatch, getState) => {
  dispatch(setChatLoading(true));
  try {
    const friendName = (typeof friend === 'object' && (friend?.userName || friend?.username)) || friend;
    if (!friendName || typeof friendName !== 'string') {
      throw new Error('Invalid friend selection');
    }

    // Set UI selection and user2
    dispatch(setActiveFriend(friend));
    dispatch(setUser2(friendName));

    const state = getState();
    const user1 = resolveCurrentUserName(state);
    if (!user1) {
      throw new Error('User not logged in or username missing');
    }

    // Create or get chat session
    const sessionRes = await api.post('/api/chat/session', { user1, user2: friendName });
    const sessionId = sessionRes.data?.sessionId;
    if (!sessionId) {
      throw new Error('Failed to get chat session');
    }
    dispatch(setActiveSessionId(sessionId));

    // Load previous messages
    const messagesRes = await api.get(`/api/chat/messages/${sessionId}`, { params: { limit: 10 } });
    const messages = messagesRes.data?.messages || [];
    const nextCursor = messagesRes.data?.nextCursor || null;
    const hasMore = !!messagesRes.data?.hasMore;
    dispatch(setMessagesForFriend({ friendName, messages }));
    dispatch(setCursorForFriend({ friendName, nextCursor, hasMore }));

    // Optimistically clear unread count for this friend on open
    dispatch(clearUnreadForFriend(friendName));
  } catch (error) {
    console.error('Error selecting friend / loading chat:', error);
    const message = error.response?.data?.message || error.message || 'Failed to load chat';
    dispatch(setError(message));
  } finally {
    dispatch(setChatLoading(false));
  }
};