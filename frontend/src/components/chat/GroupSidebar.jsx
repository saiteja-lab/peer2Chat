import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Users, Plus, Loader } from "lucide-react";
import { fetchGroups, selectGroupAndLoadChat } from "../../features/chatSlice";

export const GroupSidebar = ({ onToggleCreateGroup }) => {
  const dispatch = useDispatch();
  const { groups, activeGroup, groupsLoading } = useSelector((state) => state.chat);

  useEffect(() => {
    dispatch(fetchGroups());
  }, [dispatch]);

  const handleGroupClick = (group) => {
    dispatch(selectGroupAndLoadChat(group));
  };

  return (
    <div className="w-80 h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users size={24} />
            Group Chats
          </h2>
          <button
            onClick={onToggleCreateGroup}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            title="Create New Group"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
        <p className="text-white/80 text-sm">
          {groups.length} {groups.length === 1 ? "group" : "groups"}
        </p>
      </div>

      {/* Groups List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {groupsLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader className="animate-spin text-indigo-600" size={32} />
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <Users size={48} className="text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium mb-2">No groups yet</p>
            <p className="text-gray-400 text-sm mb-4">
              Create a group to start chatting with multiple friends
            </p>
            <button
              onClick={onToggleCreateGroup}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus size={18} />
              Create Group
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {groups.map((group) => {
              const isActive = activeGroup?.groupId === group.groupId;
              
              return (
                <div
                  key={group.groupId}
                  onClick={() => handleGroupClick(group)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-indigo-50 border-l-4 border-indigo-600"
                      : "hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Group Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                      <Users size={24} className="text-white" />
                    </div>

                    {/* Group Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`font-semibold truncate ${
                            isActive ? "text-indigo-700" : "text-gray-800"
                          }`}
                        >
                          {group.groupName}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Users size={14} />
                        <span>{group.members?.length || 0} members</span>
                      </div>

                      {/* Last Message Preview */}
                      {group.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {group.lastSender && (
                            <span className="font-medium">{group.lastSender}: </span>
                          )}
                          {group.lastMessage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Group Button (Bottom) */}
      {/* <div className="p-4 border-t border-gray-200">
        <button
          onClick={onToggleCreateGroup}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-md"
        >
          <Plus size={20} />
          Create New Group
        </button>
      </div> */}
    </div>
  );
};

export default GroupSidebar;

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
if (!document.head.querySelector('style[data-scrollbar="custom-group"]')) {
  style.setAttribute('data-scrollbar', 'custom-group');
  document.head.appendChild(style);
}
