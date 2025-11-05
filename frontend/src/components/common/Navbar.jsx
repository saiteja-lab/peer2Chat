import { LogOut, MessageCircle, Menu, X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../features/authSlice";
import { Link } from "react-router-dom";
import { useState } from "react";

export const Navbar = () => {
  const dispatch = useDispatch();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const currentUser = useSelector((state) => state.auth.currentUser);

  const userName =
    typeof currentUser === "object"
      ? currentUser?.username || currentUser?.userName
      : currentUser;
  const avatar =
    typeof currentUser === "object" ? currentUser?.avatar : null;

  const handleLogout = () => {
    dispatch(logout());
    setMobileMenuOpen(false);
  };

  return (
    <nav className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 backdrop-blur-lg border-b border-white/10 shadow-lg fixed top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-center justify-center bg-white/20 p-2 rounded-xl backdrop-blur-sm group-hover:bg-white/30 transition-all duration-300 group-hover:rotate-12">
              <MessageCircle size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight group-hover:text-blue-100 transition-colors duration-300">
              Peer2Chat
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {/* Chat Link - Show for authenticated users */}
            {/* {isAuthenticated && (
              <Link
                to="/chat"
                className="text-white/90 hover:text-white font-medium transition-colors duration-200 hover:scale-105 transform"
              >
                Chat
              </Link>
            )} */}

            {/* Authentication Buttons or User Info */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-2 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 backdrop-blur-sm transition-all duration-200 hover:scale-105 transform"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 rounded-lg bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-all duration-200 hover:scale-105 transform shadow-md"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                {/* User Profile */}
                <Link to="/profile" className="flex items-center gap-3 bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm hover:bg-white/30 transition-all duration-200">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-sm font-bold uppercase shadow-lg hover:scale-110 transition-transform duration-200 overflow-hidden">
                    {avatar ? (
                      <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      userName ? userName.charAt(0) : "U"
                    )}
                  </div>
                  <span className="font-medium text-white truncate max-w-[120px]">
                    {userName || "User"}
                  </span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-white/20 hover:bg-red-500 px-4 py-2 rounded-lg font-medium text-sm text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 transform hover:shadow-lg"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all"
          >
            {mobileMenuOpen ? (
              <X size={24} className="text-white" />
            ) : (
              <Menu size={24} className="text-white" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/10">
            <div className="flex flex-col gap-3">
              {isAuthenticated && (
                <Link
                  to="/chat"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white/90 hover:text-white font-medium py-2 px-4 rounded-lg hover:bg-white/10 transition-all"
                >
                  Chat
                </Link>
              )}

              {!isAuthenticated ? (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-5 py-2.5 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 backdrop-blur-sm transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-5 py-2.5 rounded-lg bg-white text-blue-600 font-semibold hover:bg-blue-50 transition-all shadow-md"
                  >
                    Sign Up
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-sm font-bold uppercase shadow-lg overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        userName ? userName.charAt(0) : "U"
                      )}
                    </div>
                    <span className="font-medium text-white">
                      {userName || "User"}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 bg-white/20 hover:bg-red-500 px-4 py-2.5 rounded-lg font-medium text-white transition-all"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;