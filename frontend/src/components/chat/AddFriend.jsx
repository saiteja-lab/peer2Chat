import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import api from "../../services/api";
import { setActiveFriend, receiveMessage, fetchFriends } from "../../features/chatSlice";

export const AddFriend = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);
  const friendsList = useSelector((state) => state.chat.friends) || [];
  const [friendUsername, setFriendUsername] = useState("");
  const [localFriendsList, setLocalFriendsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (friendsList) setLocalFriendsList(friendsList);
  }, [friendsList]);

  useEffect(() => {
    if (currentUser) dispatch(fetchFriends());
  }, [currentUser, dispatch]);

  const handleAddFriend = async () => {
    if (!friendUsername.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/api/chat/addFriends", {
        user1: (typeof currentUser === "object" && (currentUser?.userName || currentUser?.username)) || currentUser,
        user2: friendUsername.trim(),
      });

      setLocalFriendsList((prev) => [...prev, friendUsername.trim()]);
      dispatch(fetchFriends());
      dispatch(setActiveFriend({ id: friendUsername.trim(), userName: friendUsername.trim() }));
      setFriendUsername("");
    } catch (err) {
      const data = err.response?.data;
      if (data?.nonExistentUsers?.length) {
        setError(`${data.message}: ${data.nonExistentUsers.join(", ")}`);
      } else {
        setError(data?.message || "Failed to add friend");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-b from-white to-gray-50 rounded-2xl shadow-lg border border-gray-200 max-w-md w-full mx-auto transition-all">
      <h2 className="text-2xl font-bold text-gray-800 mb-5 text-center border-b pb-2">
        Add a New Friend
      </h2>

      {/* Input Section */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Enter friend's username"
          value={friendUsername}
          onChange={(e) => setFriendUsername(e.target.value)}
          className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 text-gray-800 transition-all"
        />
        <button
          onClick={handleAddFriend}
          disabled={loading}
          className={`${
            loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
          } text-white px-4 py-3 rounded-lg w-full font-medium transition-all shadow-sm`}
        >
          {loading ? "Adding..." : "Add Friend"}
        </button>

        {error && (
          <p className="text-red-600 text-sm mt-2 bg-red-50 border border-red-100 p-2 rounded-lg text-center">
            {error}
          </p>
        )}
      </div>

      {/* Friends List */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-700 border-b pb-1">
          Friends List
        </h3>

        {(localFriendsList.length === 0 && friendsList.length === 0) && (
          <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-gray-100">
            No friends yet 😢
          </p>
        )}

        <ul className="max-h-64 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 transition-all">
          {(localFriendsList.length > 0 ? localFriendsList : friendsList).map((friend) => {
            const name = typeof friend === "object" ? (friend?.userName || friend?.username || "") : friend;
            if (!name) return null;

            return (
              <li
                key={name}
                onClick={() => dispatch(setActiveFriend({ id: name, userName: name }))}
                className="flex items-center space-x-3 p-3 rounded-lg cursor-pointer border border-gray-100 bg-white hover:bg-indigo-50 hover:border-indigo-200 shadow-sm hover:shadow transition-all"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-lg">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-800 font-medium text-base truncate">{name}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default AddFriend;
