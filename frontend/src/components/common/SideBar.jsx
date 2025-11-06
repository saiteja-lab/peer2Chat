import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchFriends, selectFriendAndLoadChat, incrementUnreadForFriend } from "../../features/chatSlice";
import { UserCircle, UserPlus, Loader2 } from "lucide-react";
import { on, emit } from "../../services/socket";

const norm = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
const resolveName = (objOrStr) => {
  if (!objOrStr) return '';
  if (typeof objOrStr === 'string') return objOrStr;
  return (
    objOrStr.userName ||
    objOrStr.username ||
    objOrStr.user ||
    objOrStr.name ||
    objOrStr.id ||
    ''
  );
};

const Sidebar = ({ onToggleAddFriend }) => {
  const dispatch = useDispatch();
  const { friends, activeFriend, friendsLoading, unreadCounts } = useSelector((state) => state.chat);
  const { currentUser } = useSelector((state) => state.auth);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set()); // stores normalized usernames

  const currentUserName = useMemo(() => {
    if (typeof currentUser === 'object') return currentUser?.userName || currentUser?.username || '';
    return currentUser || '';
  }, [currentUser]);

  const canonicalFriendName = (nameLike) => {
    const target = norm(resolveName(nameLike));
    const f = friends.find((fr) => norm(resolveName(fr)) === target);
    return f ? (f.userName || f) : resolveName(nameLike);
  };

  useEffect(() => {
    dispatch(fetchFriends());
  }, [dispatch]);

  useEffect(() => {
    // Presence: listen for a full list and incremental changes
    const offList = on("onlineUsers", (list) => {
      if (Array.isArray(list)) {
        const set = new Set(list.map((it) => norm(resolveName(it))));
        setOnlineUsers(set);
      }
    });
    const offJoin = on("userOnline", (user) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        const name = norm(resolveName(user));
        if (name) next.add(name);
        return next;
      });
    });
    const offLeave = on("userOffline", (user) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        const name = norm(resolveName(user));
        if (name) next.delete(name);
        return next;
      });
    });

    // Re-request presence on connect/reconnect if supported
    const offConnect = on("connect", () => {
      try { emit("getOnlineUsers"); } catch (_) {}
    });

    // Incoming messages: bump unread if not active chat
    const offMsg = on("receiveMessage", (payload) => {
      if (!payload) return;
      const sender = resolveName(payload.sender);
      const me = norm(currentUserName);
      const senderNorm = norm(sender);
      const activeName = norm(resolveName(activeFriend));
      if (!senderNorm || senderNorm === me) return; // ignore self
      if (senderNorm === activeName) return; // active chat, ChatWindow will mark read
      dispatch(incrementUnreadForFriend(canonicalFriendName(sender)));
    });

    // Server-side targeted unread increment for this user
    const offUnread = on("unreadIncrement", (payload) => {
      if (!payload) return;
      const from = resolveName(payload.from);
      const fromNorm = norm(from);
      const activeName = norm(resolveName(activeFriend));
      if (!fromNorm || fromNorm === norm(currentUserName)) return;
      if (fromNorm === activeName) return; // active chat; ChatWindow handles read
      dispatch(incrementUnreadForFriend(canonicalFriendName(from)));
    });

    // Initial presence request
    try { emit("getOnlineUsers"); } catch (_) {}

    return () => {
      offList && offList();
      offJoin && offJoin();
      offLeave && offLeave();
      offConnect && offConnect();
      offMsg && offMsg();
    };
  }, [currentUserName, activeFriend, dispatch]);

  return (
    <div className="w-80 h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCircle size={24} />
            Friends
          </h2>
          <button
            onClick={() => onToggleAddFriend && onToggleAddFriend()}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Add Friend"
          >
            <UserPlus size={20} className="text-white" />
          </button>
        </div>
        <p className="text-white/80 text-sm">
          {friends.length} {friends.length === 1 ? "friend" : "friends"}
        </p>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {friendsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : friends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <UserCircle size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium mb-2">No friends yet</p>
            <p className="text-gray-400 text-sm mb-4">
              Add friends to start chatting
            </p>
            <button
              onClick={() => onToggleAddFriend && onToggleAddFriend()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <UserPlus size={18} />
              Add Friend
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {friends.map((friend, index) => {
              const name = friend.userName || friend;
              const isActive =
                (activeFriend?.userName || activeFriend) === name;

              return (
                <div
                  key={index}
                  onClick={() => dispatch(selectFriendAndLoadChat(friend))}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 border-l-4 border-indigo-600"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Friend Avatar */}
                    {friend?.avatar ? (
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={friend.avatar}
                          alt={`${name} avatar`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-lg">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Friend Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`font-semibold truncate ${
                            isActive ? "text-indigo-700" : "text-gray-800"
                          }`}
                        >
                          {name}
                        </h3>
                        {!isActive && (unreadCounts?.[name] > 0) && (
                          <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold text-white bg-red-500 rounded-full min-w-[20px] h-5 px-1.5">
                            {unreadCounts[name]}
                          </span>
                        )}
                      </div>
                      
                      {onlineUsers.has(norm(name)) && (
                        <p className="text-xs text-green-600 font-medium">● Online</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

// Add custom scrollbar styles
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #6366f1 0%, #a855f7 100%);
    border-radius: 10px;
    transition: background 0.3s ease;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #4f46e5 0%, #9333ea 100%);
  }
  
  /* Firefox */
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #6366f1 #f1f5f9;
  }
`;
if (!document.head.querySelector('style[data-scrollbar="custom"]')) {
  style.setAttribute('data-scrollbar', 'custom');
  document.head.appendChild(style);
}
