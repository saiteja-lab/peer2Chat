import { useMemo, useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { chatService } from "../../services/chatService";
import { getSocket, onReceiveMessage, on } from "../../services/socket";
import { sendMessageLocal, setMessagesForFriend, prependMessagesForFriend, setCursorForFriend } from "../../features/chatSlice";
import { Loader2 } from "lucide-react";

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

  return (
    <div className="flex flex-col flex-1 bg-white shadow-lg rounded-2xl mx-3 my-4 overflow-hidden border border-gray-200">
      {/* Chat Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-500 text-white flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {user2 ? `Chat with ${user2}` : "Chat Window"}
        </h2>
        {user2 && (
          <span className="text-sm opacity-90">
            {messages.length} message{messages.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Messages Section */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 relative">
        {!user2 && (
          <p className="text-gray-500 text-center mt-10">
            Select a friend to start chatting 💬
          </p>
        )}

        {user2 && chatLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm z-10">
            <Loader2 className="animate-spin mr-2 text-indigo-600" size={28} />
            <span className="text-indigo-700 font-medium">Loading chat…</span>
          </div>
        )}

        {/* Load older */}
        {user2 && !chatLoading && canLoadOlder && (
          <div className="flex justify-center mb-3">
            <button
              onClick={loadOlder}
              disabled={loadingOlder}
              className="text-sm text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full disabled:opacity-50"
            >
              {loadingOlder ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {user2 &&
          !chatLoading &&
          messages.map((msg, i) => {
            const mine = isMine(msg);
            const d = getMsgDate(msg);
            const prev = i > 0 ? getMsgDate(messages[i - 1]) : null;
            const showDateHeader = !prev || !isSameDay(d, prev);
            return (
              <div key={i} className="my-1 cw-fade-in">
                {showDateHeader && (
                  <div className="flex justify-center my-3">
                    <span className="text-xs bg-gray-200 px-3 py-1 rounded-full text-gray-700">
                      {formatDayLabel(d)}
                    </span>
                  </div>
                )}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`relative group px-4 py-2 max-w-[75%] rounded-2xl shadow-sm ${
                      mine
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white border border-gray-300 text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <div>
                      {msg?.deleted ? (
                        <span className={mine ? "text-white/80 italic" : "text-gray-500 italic"}>
                          Message deleted
                        </span>
                      ) : (
                        msg.message
                      )}
                    </div>
                    <div
                      className={`text-[10px] mt-1 select-none ${
                        mine ? "text-white/80 text-right" : "text-gray-500 text-left"
                      }`}
                    >
                      {(() => {
                        const ts =
                          msg?.timestamp ||
                          msg?.createdAt ||
                          msg?.time ||
                          msg?.sentAt ||
                          msg?.date;
                        if (!ts) return "";
                        const d2 =
                          typeof ts === "number" ? new Date(ts) : new Date(ts);
                        if (isNaN(d2.getTime())) return "";
                        const t = d2.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return mine
                          ? `${t} • ${msg?.read ? "Seen" : "Delivered"}`
                          : t;
                      })()}
                    </div>

                    {mine && !msg?.deleted && (
                      <button
                        className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full shadow-md hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => handleDelete(msg)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        <div ref={listEndRef} />
      </div>

      {/* Message Input */}
      {user2 && (
        <div className="p-3 border-t bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            onClick={handleSend}
            disabled={!message?.trim() || !activeSessionId}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            Send
          </button>
        </div>
      )}

      <style>
        {`
          @keyframes cw-fade-in {
            from { opacity: 0; transform: translateY(6px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .cw-fade-in {
            animation: cw-fade-in 300ms ease-out;
          }
        `}
      </style>
    </div>
  );
};
