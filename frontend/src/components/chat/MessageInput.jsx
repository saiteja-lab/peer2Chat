
import { useState } from "react";
import { Send } from "lucide-react";

const MessageInput = ({ onSend }) => {
  const [message, setMessage] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };

  return (
    <form
      onSubmit={handleSend}
      className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
    >
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="flex-1 border-2 border-gray-200 rounded-full px-4 py-2 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none"
      />
      <button
        type="submit"
        className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition"
      >
        <Send className="w-5 h-5" />
      </button>
    </form>
  );
};

export default MessageInput;
