import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import Sidebar from "../components/common/SideBar";
import { ChatWindow } from "../components/chat/ChatWindow";
import { Navbar } from "../components/common/Navbar";
import MainSideBar from "../components/common/MainSideBar";
import { connectSocket } from "../services/socket";
import { AddFriend } from "../components/chat/AddFriend";

export const ChatPage = () => {
  const { currentUser } = useSelector((state) => state.auth);
  const [showAddFriend, setShowAddFriend] = useState(false);

  useEffect(() => {
    if (currentUser) {
      connectSocket(currentUser);
    }
  }, [currentUser]);

  const handleToggle = () => {
    setShowAddFriend((prev) => !prev);
  };

  return (
    <>
      <Navbar />
      <div className="h-16" />
      <div className="flex h-[calc(100vh-64px)] w-full bg-gradient-to-br from-gray-50 to-gray-200 relative overflow-hidden min-h-0">
        {/* Main Navigation Sidebar */}
        <MainSideBar />
        
        {/* Friends Sidebar Container */}
        <div className="relative flex-shrink-0 bg-white shadow-md border-r border-gray-200 h-full">
          <Sidebar onToggleAddFriend={handleToggle} />

          {/* Overlay AddFriend */}
          {showAddFriend && (
            <div className="absolute inset-0 bg-white shadow-xl z-20 p-6 rounded-lg transition-all duration-300 ease-in-out">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h2 className="text-xl font-semibold text-gray-800">
                  Add a Friend
                </h2>
                <button
                  onClick={handleToggle}
                  className="text-gray-500 hover:text-gray-800 text-2xl font-bold"
                >
                  ✕
                </button>
              </div>
              <AddFriend />
            </div>
          )}

          {/* Action Buttons */}
          {/* <div className="absolute bottom-4 left-4 flex flex-col gap-3">
            <button
              onClick={() => setShowAddFriend(true)}
              className="w-40 bg-green-600 text-white font-medium py-2 rounded-lg shadow hover:bg-green-700 transition"
            >
              ➕ Add Friend
            </button>

            <button
              onClick={handleToggle}
              className="w-40 bg-blue-500 text-white font-medium py-2 rounded-lg shadow hover:bg-blue-600 transition"
            >
              {showAddFriend ? "Close Panel" : "Add Friend Panel"}
            </button>
          </div> */}
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col bg-white shadow-inner rounded-l-2xl overflow-hidden min-h-0">
          <ChatWindow />
        </div>
      </div>
    </>
  );
};

export default ChatPage;
