import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  MessageCircle,
  Code2,
  Home as HomeIcon,
} from "lucide-react";

const NavItem = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200
      ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
          : "text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
      }`}
    aria-label={label}
  >
    <Icon size={22} />
    {!collapsed && (
      <span className="font-medium tracking-wide">{label}</span>
    )}
  </button>
);

const MainSideBar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isHome = location.pathname === "/";
  const isChat = location.pathname.startsWith("/chat");
  const isDev = location.pathname.startsWith("/developer");

  const go = (path) => navigate(path);

  return (
    <aside
      className={`fixed lg:sticky top-16 left-0 h-[calc(100vh-64px)] border-r border-gray-200 shadow-xl transition-all duration-300
      ${
        open ? "w-64" : "w-20"
      } bg-white/60 backdrop-blur-md z-40 flex flex-col`}
      aria-label="Main sidebar"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
          aria-label="Toggle sidebar"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        {open && (
          <span className="text-lg font-semibold text-indigo-700">Menu</span>
        )}
        {open && <div className="w-6" />}
      </div>

      {/* Navigation */}
      <nav className={`p-3 flex-1 space-y-2 ${open ? "overflow-y-auto" : "overflow-y-hidden"}`}>
        <div className="group">
          <NavItem
            icon={HomeIcon}
            label="Home"
            active={isHome}
            onClick={() => go("/")}
            collapsed={!open}
          />
        </div>
        <div className="group">
          <NavItem
            icon={MessageCircle}
            label="Chat"
            active={isChat}
            onClick={() => go("/chat")}
            collapsed={!open}
          />
        </div>
        <div className="group">
          <NavItem
            icon={Code2}
            label="Meet the Developer"
            active={isDev}
            onClick={() => go("/developer")}
            collapsed={!open}
          />
        </div>
      </nav>

      {/* Footer / Version */}
      {open && (
        <div className="p-3 border-t border-gray-200 text-center text-xs text-gray-500">
          <span>© 2025 Peer@Chat</span>
        </div>
      )}
    </aside>
  );
};

export default MainSideBar;
