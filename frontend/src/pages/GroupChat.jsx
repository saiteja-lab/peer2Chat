import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navbar } from "../components/common/Navbar";
import MainSideBar from "../components/common/MainSideBar";
import { connectSocket } from "../services/socket";
import { fetchGroups, fetchFriends } from "../features/chatSlice";
import CreateGroup from "../components/chat/CreateGroup";
import { GroupChatWindow } from "../components/chat/GroupChatWindow";
import { GroupSidebar } from "../components/chat/GroupSidebar";

export const GroupChat = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    if (currentUser) {
      connectSocket(currentUser);
      dispatch(fetchGroups());
      dispatch(fetchFriends());
    }
  }, [currentUser, dispatch]);

  return (
    <>
      <Navbar />
      <div className="h-16" />
      <div className="flex h-[calc(100vh-64px)] w-full bg-gradient-to-br from-gray-50 to-gray-200 relative overflow-hidden min-h-0">
        {/* Main Navigation Sidebar */}
        <MainSideBar />
        
        {/* Groups Sidebar Container */}
        <div className="relative flex-shrink-0 bg-white shadow-md border-r border-gray-200 h-full">
          <GroupSidebar onToggleCreateGroup={() => setShowCreateGroup(true)} />
        </div>

        {/* Group Chat Window */}
        <div className="flex-1 flex flex-col bg-white shadow-inner rounded-l-2xl overflow-hidden min-h-0">
          <GroupChatWindow />
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <CreateGroup onClose={() => setShowCreateGroup(false)} />
      )}
    </>
  );
};

export default GroupChat;
