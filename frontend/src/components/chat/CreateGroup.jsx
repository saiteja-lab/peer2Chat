import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Users, X, Check } from "lucide-react";
import { groupService } from "../../services/groupService";
import { fetchGroups } from "../../features/chatSlice";

export const CreateGroup = ({ onClose }) => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);
  const { friends } = useSelector((state) => state.chat);
  
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUserName =
    typeof currentUser === "object"
      ? currentUser?.userName || currentUser?.username
      : currentUser;

  const toggleMember = (friendName) => {
    setSelectedMembers((prev) =>
      prev.includes(friendName)
        ? prev.filter((m) => m !== friendName)
        : [...prev, friendName]
    );
  };

  const handleCreate = async () => {
    setError("");
    
    if (!groupName.trim()) {
      setError("Please enter a group name");
      return;
    }

    if (selectedMembers.length < 1) {
      setError("Please select at least 1 friend");
      return;
    }

    setLoading(true);
    try {
      await groupService.createGroup(
        groupName.trim(),
        currentUserName,
        selectedMembers
      );
      
      // Refresh groups list
      await dispatch(fetchGroups());
      
      // Close modal
      onClose && onClose();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Failed to create group";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Users size={24} />
            <h2 className="text-xl font-semibold">Create New Group</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Group Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              maxLength={50}
            />
          </div>

          {/* Members Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Members ({selectedMembers.length} selected)
            </label>
            <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
              {friends.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No friends available. Add friends first!
                </p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {friends.map((friend) => {
                    const friendName = friend.userName || friend;
                    const isSelected = selectedMembers.includes(friendName);
                    
                    return (
                      <div
                        key={friendName}
                        onClick={() => toggleMember(friendName)}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition ${
                          isSelected
                            ? "bg-indigo-50 hover:bg-indigo-100"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && <Check size={16} className="text-white" />}
                        </div>
                        
                        {friend?.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friendName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                            {friendName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        
                        <span className="font-medium text-gray-800">
                          {friendName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !groupName.trim() || selectedMembers.length === 0}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;
