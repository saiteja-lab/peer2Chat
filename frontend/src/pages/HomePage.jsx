import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Shield, Smile, Globe, Zap, Lock, Cpu } from 'lucide-react';
import { useSelector } from 'react-redux';
import Navbar from '../components/common/Navbar';
import MainSideBar from '../components/common/MainSideBar';

export const HomePage = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-200 via-indigo-300 to-violet-400 relative overflow-hidden">
      {/* Decorative glowing blobs */}
      <div className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl top-[-10%] left-[-10%] animate-pulse" />
      <div className="absolute w-80 h-80 bg-violet-500/30 rounded-full blur-3xl bottom-[-10%] right-[-10%] animate-pulse" />

      <Navbar />
      <div className="h-16" />

      <div className="flex h-[calc(100vh-64px)] w-full">
        <MainSideBar />

        <div className="flex-1 overflow-y-auto">
          {/* Hero Section */}
          <section className="flex flex-col items-center justify-center text-center mt-24 px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl bg-white/30 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20"
            >
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 leading-tight">
                Connect, Chat & Share —{" "}
                <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                  Peer-to-Peer
                </span>{" "}
                Style 🚀
              </h1>
              <p className="text-gray-700 text-lg md:text-xl mb-10 leading-relaxed">
                Peer2Chat redefines real-time communication with secure, server-free peer-to-peer messaging.  
                Built for privacy, speed, and genuine connection — you chat directly, without intermediaries.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/chat"
                  className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold hover:shadow-lg hover:shadow-violet-300/40 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Start Chatting
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/register"
                    className="px-8 py-4 rounded-xl border border-white/40 text-gray-900 bg-white/50 font-semibold hover:bg-white/80 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
                  >
                    Join Now
                  </Link>
                )}
              </div>
            </motion.div>
          </section>

          {/* Core Features Section */}
          <section className="py-20 px-6 mt-20 bg-gradient-to-br from-white/60 to-blue-100/40 backdrop-blur-lg border-t border-white/30">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-extrabold text-center mb-14 bg-gradient-to-r from-blue-700 to-violet-700 bg-clip-text text-transparent"
            >
              ⚡ Why Choose Peer2Chat?
            </motion.h2>

            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-white/50 rounded-2xl shadow-md border border-blue-200/50 backdrop-blur-md"
              >
                <MessageCircle className="mx-auto mb-3 text-blue-600" size={44} />
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Instant Messaging</h3>
                <p className="text-gray-600 text-sm">
                  Experience lightning-fast, real-time chats powered by WebRTC-based peer-to-peer networking.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-white/50 rounded-2xl shadow-md border border-indigo-200/50 backdrop-blur-md"
              >
                <Users className="mx-auto mb-3 text-indigo-600" size={44} />
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Group Conversations</h3>
                <p className="text-gray-600 text-sm">
                  Create private groups, add friends, and enjoy shared conversations with total control.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-white/50 rounded-2xl shadow-md border border-violet-200/50 backdrop-blur-md"
              >
                <Zap className="mx-auto mb-3 text-violet-600" size={44} />
                <h3 className="font-semibold text-lg mb-2 text-gray-800">High Performance</h3>
                <p className="text-gray-600 text-sm">
                  Built with optimized connections ensuring minimal delay and seamless interaction even on mobile.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-white/50 rounded-2xl shadow-md border border-blue-200/50 backdrop-blur-md"
              >
                <Lock className="mx-auto mb-3 text-blue-700" size={44} />
                <h3 className="font-semibold text-lg mb-2 text-gray-800">End-to-End Security</h3>
                <p className="text-gray-600 text-sm">
                  Your chats are encrypted and never stored on any server — only between you and your peer.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Tech Stack Section */}
          <section className="py-20 px-6 bg-gradient-to-br from-blue-100/60 to-violet-100/40 border-t border-white/20">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-extrabold text-center mb-12 bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent"
            >
              🧠 Built with Modern Tech
            </motion.h2>

            <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 text-center">
              {[
                { icon: <Cpu size={38} className="mx-auto text-blue-600" />, label: "React + Redux" },
                { icon: <Globe size={38} className="mx-auto text-indigo-600" />, label: "Node.js & Express" },
                { icon: <Shield size={38} className="mx-auto text-violet-600" />, label: "WebRTC Secure Channels" },
                { icon: <Zap size={38} className="mx-auto text-blue-500" />, label: "Tailwind + Framer Motion" },
              ].map((tech, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.08 }}
                  className="bg-white/50 backdrop-blur-md p-6 rounded-2xl shadow-md border border-white/30"
                >
                  {tech.icon}
                  <h4 className="mt-3 text-gray-800 font-medium">{tech.label}</h4>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Chatting Etiquette & Safety */}
          <section className="py-20 px-8 bg-gradient-to-br from-white/60 to-blue-100/40 backdrop-blur-lg border-t border-white/30">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-4xl font-extrabold text-center mb-14 bg-gradient-to-r from-blue-700 to-violet-700 bg-clip-text text-transparent"
            >
              💬 Chatting Etiquette & Safety
            </motion.h2>

            <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-blue-50/70 rounded-2xl shadow-sm border border-blue-200/60"
              >
                <Smile className="mx-auto mb-3 text-blue-600" size={40} />
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Be Respectful</h3>
                <p className="text-gray-600 text-sm">
                  Treat others kindly. Peer2Chat fosters positivity and meaningful interactions.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-green-50/70 rounded-2xl shadow-sm border border-green-200/60"
              >
                <Shield className="mx-auto mb-3 text-green-600" size={40} />
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Stay Secure</h3>
                <p className="text-gray-600 text-sm">
                  Never share personal data or credentials. Privacy is key — keep your chats safe.
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-6 bg-violet-50/70 rounded-2xl shadow-sm border border-violet-200/60"
              >
                <Users className="mx-auto mb-3 text-violet-600" size={40} />
                <h3 className="font-semibold text-lg mb-2 text-gray-800">Build Connections</h3>
                <p className="text-gray-600 text-sm">
                  Connect globally. Grow friendships and collaborate with peers around the world.
                </p>
              </motion.div>
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center py-8 text-gray-600 text-sm border-t border-white/40 bg-white/40 backdrop-blur-md">
            <p>
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-blue-700">Peer2Chat</span> — Built for Real Connections 💙
            </p>
            <p className="text-xs mt-2">Made with 💜 by Sai</p>
          </footer>
        </div>
      </div>
    </div>
  );
};
