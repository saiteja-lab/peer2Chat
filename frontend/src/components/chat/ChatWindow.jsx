import { useMemo, useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { chatService } from "../../services/chatService";
import { getSocket, onReceiveMessage, on } from "../../services/socket";
import { sendMessageLocal, setMessagesForFriend, prependMessagesForFriend, setCursorForFriend } from "../../features/chatSlice";
import { Loader2, Send, Trash2, UserCircle } from "lucide-react";

export const ChatWindow = () => {
  const { currentUser } = useSelector((state) => state.auth);
  const { messages: messagesByFriend, user2, chatLoading, cursors, activeSessionId } = useSelector((state) => state.chat);
  const [message, setMessage] = useState("");

  const currentUserName = useMemo(() => {
    return (
      (typeof currentUser === "object" &&
        (currentUser?.userName || currentUser?.username)) ||
      currentUser
    );
  }, [currentUser]);

  const messages = messagesByFriend?.[user2] || [];

  const normalize = (v) =>
    typeof v === "string" ? v.trim().toLowerCase() : "";
  const getSender = (m) =>
    m?.sender || m?.senderId || m?.from || m?.user || m?.username || "";
  const isMine = (m) => normalize(getSender(m)) === normalize(currentUserName);

  const dispatch = useDispatch();

  const handleSend = async () => {
    const text = message?.trim();
    const sender = currentUserName;
    if (!text || !sender || !activeSessionId || !user2) return;
    try {
      dispatch(
        sendMessageLocal({
          friendId: user2,
          message: { sender, message: text, timestamp: Date.now() },
        })
      );
      setMessage("");
      await chatService.sendMessage(activeSessionId, sender, text);
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  };

  useEffect(() => {
    if (!activeSessionId) return;
    const socket = getSocket();
    socket?.emit("joinSession", activeSessionId);
    return () => socket?.emit("leaveSession", activeSessionId);
  }, [activeSessionId]);

  const seenMessageIdsRef = useRef(new Set());
  const listEndRef = useRef(null);

  const findLastIndex = (arr, predicate) => {
    for (let i = arr.length - 1; i >= 0; i--) {
      if (predicate(arr[i], i)) return i;
    }
    return -1;
  };

  const getMsgDate = (m) => {
    const ts =
      m?.timestamp || m?.createdAt || m?.time || m?.sentAt || m?.date;
    if (!ts) return null;
    const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  };

  const isSameDay = (a, b) => {
    if (!a || !b) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const formatDayLabel = (d) => {
    if (!d) return "";
    const now = new Date();
    if (isSameDay(d, now)) return "Today";
    return d.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async (msg) => {
    if (!activeSessionId || !currentUserName || !user2) return;
    const text = msg?.message;
    if (!text) return;

    // Optimistically mark as deleted locally (do not remove)
    const current = messages.slice();
    const idx = findLastIndex(current, (m) => isMine(m) && m.message === text && !m.deleted);
    if (idx !== -1) {
      const next = current.slice();
      next[idx] = { ...next[idx], deleted: true };
      dispatch(setMessagesForFriend({ friendName: user2, messages: next }));
    }

    try {
      await chatService.deleteMessage(activeSessionId, currentUserName, text);
    } catch (e) {
      console.error("Failed to delete message:", e);
      // Optional: revert optimistic state if needed
    }
  };

  // Socket listeners (same as before, untouched)
  useEffect(() => {
    const off = onReceiveMessage((payload) => {
      if (!payload || payload.sessionId !== activeSessionId) return;
      if (normalize(payload.sender) === normalize(currentUserName)) return;
      const mid = payload.messageId || payload.id;
      if (mid) {
        if (seenMessageIdsRef.current.has(mid)) return;
        seenMessageIdsRef.current.add(mid);
      }
      const friendKey = user2;
      if (!friendKey) return;
      dispatch(
        sendMessageLocal({
          friendId: friendKey,
          message: {
            sender: payload.sender,
            message: payload.message,
            id: payload.messageId || payload.id,
            timestamp:
              payload.timestamp || payload.createdAt || Date.now(),
          },
        })
      );
    });

    // Listen for server-side deletion to mark message as deleted by id
    const offDel = on("messageDeleted", (payload) => {
      if (!payload || payload.sessionId !== activeSessionId) return;
      const mid = payload.messageId;
      if (!mid) return;
      const current = (messagesByFriend?.[user2] || []).slice();
      let mutated = false;
      for (let i = 0; i < current.length; i++) {
        if (current[i]?.id === mid) {
          current[i] = { ...current[i], deleted: true };
          mutated = true;
          break;
        }
      }
      if (mutated) {
        dispatch(setMessagesForFriend({ friendName: user2, messages: current }));
      }
    });

    return () => {
      off && off();
      offDel && offDel();
    };
  }, [activeSessionId, user2, currentUserName, dispatch, messagesByFriend]);

  useEffect(() => {
    if (!listEndRef.current) return;
    listEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeSessionId]);

  useEffect(() => {
    const off = on("messagesMarkedRead", (payload) => {
      if (!payload || payload.sessionId !== activeSessionId) return;
      const reader = payload.userId;
      if (!reader || normalize(reader) !== normalize(user2)) return;
      const current = messages.slice();
      const next = current.map((m) => (isMine(m) ? { ...m, read: true } : m));
      dispatch(setMessagesForFriend({ friendName: user2, messages: next }));
    });
    return () => off && off();
  }, [activeSessionId, user2, messages, dispatch]);

  useEffect(() => {
    if (!activeSessionId || !currentUserName || !user2) return;
    const hasUnreadIncoming = messages.some((m) => !isMine(m) && !m?.read);
    if (!hasUnreadIncoming) return;
    (async () => {
      try {
        await chatService.markMessagesAsRead(activeSessionId, currentUserName);
        const next = messages.map((m) => (!isMine(m) ? { ...m, read: true } : m));
        dispatch(setMessagesForFriend({ friendName: user2, messages: next }));
      } catch (e) {
        console.error("Failed to mark messages as read:", e);
      }
    })();
  }, [activeSessionId, user2, messages, currentUserName, dispatch]);

  const [loadingOlder, setLoadingOlder] = useState(false);

  const friendCursor = user2 ? cursors?.[user2] : null;
  const canLoadOlder = !!friendCursor?.hasMore;

  const loadOlder = async () => {
    if (!activeSessionId || !user2 || !friendCursor?.nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await chatService.getMessages(activeSessionId, 10, friendCursor.nextCursor);
      const older = res?.messages || [];
      const nextCursor = res?.nextCursor || null;
      const hasMore = !!res?.hasMore;
      if (older.length > 0) {
        dispatch(prependMessagesForFriend({ friendName: user2, older }));
      }
      dispatch(setCursorForFriend({ friendName: user2, nextCursor, hasMore }));
    } catch (e) {
      console.error("Failed to load older messages:", e);
    } finally {
      setLoadingOlder(false);
    }
  };

  if (!user2) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <UserCircle size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Friend Selected
          </h3>
          <p className="text-gray-500">
            Select a friend from the sidebar to start chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <UserCircle size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{user2}</h2>
              <p className="text-sm text-white/80">
                {messages.length} {messages.length === 1 ? "message" : "messages"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {chatLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <>
            {/* Load Older Messages Button */}
            {canLoadOlder && (
              <div className="text-center">
                <button
                  onClick={loadOlder}
                  disabled={loadingOlder}
                  className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow hover:bg-gray-50 transition disabled:opacity-50"
                >
                  {loadingOlder ? "Loading..." : "Load Older Messages"}
                </button>
              </div>
            )}

            {/* Messages */}
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const mine = isMine(msg);
                const d = getMsgDate(msg);
                const prev = i > 0 ? getMsgDate(messages[i - 1]) : null;
                const showDateHeader = !prev || !isSameDay(d, prev);
                
                return (
                  <div key={i}>
                    {showDateHeader && (
                      <div className="flex justify-center my-3">
                        <span className="text-xs bg-gray-200 px-3 py-1 rounded-full text-gray-700">
                          {formatDayLabel(d)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] ${mine ? "items-end" : "items-start"}`}>
                        {/* Message Bubble */}
                        <div
                          className={`relative group px-4 py-2 rounded-2xl shadow ${
                            mine
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none"
                              : "bg-white text-gray-800 rounded-bl-none"
                          }`}
                        >
                          {msg?.deleted ? (
                            <p className="italic text-sm opacity-70">
                              Message deleted
                            </p>
                          ) : (
                            <p className="break-words">{msg.message}</p>
                          )}

                          {/* Delete Button (only for own messages) */}
                          {mine && !msg?.deleted && (
                            <button
                              onClick={() => handleDelete(msg)}
                              className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                              title="Delete message"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div
                          className={`text-xs text-gray-500 mt-1 px-2 ${
                            mine ? "text-right" : "text-left"
                          }`}
                        >
                          {(() => {
                            const ts = msg?.timestamp || msg?.createdAt || msg?.time || msg?.sentAt || msg?.date;
                            if (!ts) return "";
                            const d2 = typeof ts === "number" ? new Date(ts) : new Date(ts);
                            if (isNaN(d2.getTime())) return "";
                            const t = d2.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            return mine ? `${t} • ${msg?.read ? "Seen" : "Delivered"}` : t;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={listEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || !activeSessionId}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
