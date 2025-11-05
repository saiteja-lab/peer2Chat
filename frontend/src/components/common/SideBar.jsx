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
    <div className="bg-white/90 backdrop-blur-md border-r border-gray-200 p-4 w-72 h-[calc(100vh-64px)] flex flex-col shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-xl font-semibold text-indigo-700">Friends</h2>
        <button
          onClick={() => onToggleAddFriend && onToggleAddFriend()}
          className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all"
        >
          <UserPlus size={16} />
          <span className="text-sm font-medium">Add</span>
        </button>
      </div>

      {/* Loading State */}
      {/* {loading && (
        <div className="flex justify-center items-center flex-1 text-gray-500">
          <Loader2 className="animate-spin mr-2" size={20} />
          <p>Loading friends...</p>
        </div>
      )} */}

      {friendsLoading && (
        <div className="flex justify-center items-center flex-1 text-gray-500">
          <Loader2 className="animate-spin mr-2" size={20} />
          <p>Loading friends...</p>
        </div>
      )}

      {/* Empty State */}
      {!friendsLoading && friends.length === 0 && (
        <div className="flex flex-col justify-center items-center flex-1 text-center text-gray-500 bg-gray-50 rounded-xl p-6 shadow-inner">
          <UserCircle className="w-10 h-10 text-gray-400 mb-2" />
          <p className="font-medium text-gray-600">No friends yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Click <span className="text-indigo-600 font-medium">Add</span> to start chatting.
          </p>
        </div>
      )}

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {friends.map((friend, index) => {
          const name = friend.userName || friend;
          const isActive =
            (activeFriend?.userName || activeFriend) === name;

          return (
            <div
              key={index}
              onClick={() => dispatch(selectFriendAndLoadChat(friend))}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-1 transition-all ${
                isActive
                  ? "bg-indigo-100 border border-indigo-200 shadow-sm"
                  : "hover:bg-gray-100"
              }`}
            >
              {friend?.avatar ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-indigo-200 shadow-sm">
                  <img
                    src={friend.avatar}
                    alt={`${name} avatar`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div
                  className={`relative w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? "bg-indigo-500 text-white"
                      : "bg-indigo-100 text-indigo-500"
                  } font-semibold`}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`font-medium truncate ${
                      isActive ? "text-indigo-700" : "text-gray-800"
                    }`}
                  >
                    {name}
                  </p>
                  {!isActive && (unreadCounts?.[name] > 0) && (
                    <span className="ml-2 inline-flex items-center justify-center text-xs font-semibold text-white bg-red-500 rounded-full min-w-[20px] h-5 px-1">
                      {unreadCounts[name]}
                    </span>
                  )}
                </div>
                {onlineUsers.has(norm(name)) && (
                  <p className="text-xs text-green-600 font-medium">● Online</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Footer */}
      <div className="mt-4 text-center text-xs text-gray-400">
        <p>Peer2Peer ChatApp © 2025</p>
      </div>
    </div>
  );
};

export default Sidebar;
