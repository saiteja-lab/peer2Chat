import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Users, Send, Loader, Trash2, X } from "lucide-react";
import { groupService } from "../../services/groupService";
import { sendGroupMessageLocal, prependGroupMessages } from "../../features/chatSlice";
import { getSocket, on } from "../../services/socket";

export const GroupChatWindow = () => {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
  const { currentUser } = useSelector((state) => state.auth);
  const { 
    activeGroup, 
    groupMessages, 
    groupCursors,
    chatLoading 
  } = useSelector((state) => state.chat);

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [showMembers, setShowMembers] = useState(false);

  const currentUserName =
    typeof currentUser === "object"
      ? currentUser?.userName || currentUser?.username
      : currentUser;

  const groupId = activeGroup?.groupId;
  const messages = groupMessages?.[groupId] || [];
  const cursor = groupCursors?.[groupId];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Join group room on mount
  useEffect(() => {
    if (!groupId) return;
    const socket = getSocket();
    socket?.emit("joinGroup", groupId);
    
    return () => {
      socket?.emit("leaveGroup", groupId);
    };
  }, [groupId]);

  // Listen for real-time group messages
  useEffect(() => {
    if (!groupId) return;

    const offGroupMsg = on("receiveGroupMessage", (payload) => {
      if (!payload || payload.groupId !== groupId) return;
      
      // Don't add if it's our own message
      if (payload.sender === currentUserName) return;

      dispatch(sendGroupMessageLocal({
        groupId: payload.groupId,
        message: {
          sender: payload.sender,
          message: payload.message,
          id: payload.messageId,
          timestamp: payload.timestamp || Date.now(),
          deleted: false
        }
      }));
    });

    const offDeleted = on("groupMessageDeleted", (payload) => {
      if (!payload || payload.groupId !== groupId) return;
      // Refresh messages to show deleted state
      loadMessages();
    });

    return () => {
      offGroupMsg && offGroupMsg();
      offDeleted && offDeleted();
    };
  }, [groupId, currentUserName, dispatch]);

  const loadMessages = async () => {
    if (!groupId) return;
    try {
      const res = await groupService.getGroupMessages(groupId, 10);
      dispatch({
        type: "chat/setGroupMessages",
        payload: { groupId, messages: res.messages || [] }
      });
      dispatch({
        type: "chat/setGroupCursor",
        payload: {
          groupId,
          nextCursor: res.nextCursor,
          hasMore: res.hasMore
        }
      });
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleSend = async () => {
    const text = message?.trim();
    if (!text || !groupId || !currentUserName) return;

    setSending(true);
    try {
      // Optimistically add message
      dispatch(sendGroupMessageLocal({
        groupId,
        message: {
          sender: currentUserName,
          message: text,
          timestamp: Date.now(),
          deleted: false
        }
      }));
      
      setMessage("");
      
      // Send to server
      await groupService.sendGroupMessage(groupId, currentUserName, text);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = async (msg) => {
    if (!groupId || !currentUserName) return;
    if (msg.sender !== currentUserName) return;
    
    const confirmDelete = window.confirm("Delete this message?");
    if (!confirmDelete) return;

    try {
      await groupService.deleteGroupMessage(groupId, currentUserName, msg.message);
      // Refresh messages
      await loadMessages();
    } catch (err) {
      console.error("Failed to delete message:", err);
      alert("Failed to delete message.");
    }
  };

  const loadOlderMessages = async () => {
    if (!groupId || !cursor?.hasMore || loadingOlder) return;
    
    setLoadingOlder(true);
    try {
      const res = await groupService.getGroupMessages(
        groupId,
        10,
        cursor.nextCursor
      );
      
      dispatch(prependGroupMessages({
        groupId,
        older: res.messages || []
      }));
      
      dispatch({
        type: "chat/setGroupCursor",
        payload: {
          groupId,
          nextCursor: res.nextCursor,
          hasMore: res.hasMore
        }
      });
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingOlder(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getMsgDate = (msg) => {
    const ts = msg?.timestamp || msg?.createdAt || msg?.time || msg?.sentAt || msg?.date;
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

  if (!activeGroup) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <Users size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Group Selected
          </h3>
          <p className="text-gray-500">
            Select a group from the sidebar or create a new one
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
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-white/10 rounded-lg p-2 -m-2 transition-colors"
            onClick={() => setShowMembers(true)}
            title="Click to view members"
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{activeGroup.groupName}</h2>
              <p className="text-sm text-white/80">
                {activeGroup.members?.length || 0} members
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMembers(false)}>
          <div className="bg-white rounded-lg shadow-2xl w-96 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Users size={24} />
                <h3 className="text-lg font-bold">Group Members</h3>
              </div>
              <button
                onClick={() => setShowMembers(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1">
              <div className="mb-3">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">{activeGroup.groupName}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {activeGroup.members?.length || 0} {activeGroup.members?.length === 1 ? 'member' : 'members'}
                </p>
              </div>

              <div className="space-y-2">
                {activeGroup.members?.map((member, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {member.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {member}
                        {member === currentUserName && (
                          <span className="ml-2 text-xs text-indigo-600 font-semibold">(You)</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowMembers(false)}
                className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {chatLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : (
          <>
            {/* Load Older Messages Button */}
            {cursor?.hasMore && (
              <div className="text-center">
                <button
                  onClick={loadOlderMessages}
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
              messages.map((msg, idx) => {
                const isMine = msg.sender === currentUserName;
                const showSender = !isMine;
                const d = getMsgDate(msg);
                const prev = idx > 0 ? getMsgDate(messages[idx - 1]) : null;
                const showDateHeader = !prev || !isSameDay(d, prev);

                return (
                  <div key={msg.id || idx}>
                    {/* Date Separator */}
                    {showDateHeader && (
                      <div className="flex justify-center my-3">
                        <span className="text-xs bg-gray-200 px-3 py-1 rounded-full text-gray-700">
                          {formatDayLabel(d)}
                        </span>
                      </div>
                    )}

                    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] ${
                          isMine ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Sender Name (for others' messages) */}
                        {showSender && (
                          <div className="text-xs font-semibold text-gray-600 mb-1 px-2">
                            {msg.sender}
                          </div>
                        )}

                      {/* Message Bubble */}
                      <div
                        className={`relative group px-4 py-2 rounded-2xl shadow ${
                          isMine
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none"
                            : "bg-white text-gray-800 rounded-bl-none"
                        }`}
                      >
                        {msg.deleted ? (
                          <p className="italic text-sm opacity-70">
                            Message deleted
                          </p>
                        ) : (
                          <p className="break-words">{msg.message}</p>
                        )}

                        {/* Delete Button (only for own messages) */}
                        {isMine && !msg.deleted && (
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
                            isMine ? "text-right" : "text-left"
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-end gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          <button
            onClick={handleSend}
            disabled={!message.trim() || sending}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatWindow;
