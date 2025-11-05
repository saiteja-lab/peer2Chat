import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Users, Shield, Smile } from 'lucide-react';
import { useSelector } from 'react-redux';
import Navbar from '../components/common/Navbar';
import MainSideBar from '../components/common/MainSideBar';


export const HomePage = () => {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated)
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      <Navbar />
      <div className="h-16" />
      <div className="flex h-[calc(100vh-64px)] w-full">
        <MainSideBar />
        <div className="flex-1 overflow-y-auto">
      
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center mt-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Connect, Chat, and Share — <span className="text-blue-600">Peer-to-Peer</span> Style
          </h1>
          <p className="text-gray-600 text-lg mb-8">
            Experience real-time private messaging built for speed, privacy, and connection.
            No servers. No snooping. Just pure peer-to-peer communication.
          </p>

          <div className="flex gap-4 justify-center">
            <Link
              to="/chat"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-md"
            >
              Start Chatting
            </Link>
            {!isAuthenticated ? (
              <Link
                to="/register"
                className="px-6 py-3 rounded-lg border border-gray-400 text-gray-700 font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-sm"
              >
                Join Now
              </Link>
            ) : null}
          </div>
        </motion.div>
      </section>

      {/* Chat Etiquette Section */}
      <section className="bg-white/80 backdrop-blur-md border-t border-gray-200 py-16 px-8 mt-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center mb-10 text-gray-800"
        >
          💬 Chatting Etiquette & Safety
        </motion.h2>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-blue-50 rounded-2xl shadow-sm border border-blue-100"
          >
            <Smile className="mx-auto mb-3 text-blue-600" size={40} />
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Be Respectful</h3>
            <p className="text-gray-600 text-sm">
              Treat others as you want to be treated. Respect opinions and keep the conversation friendly.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-green-50 rounded-2xl shadow-sm border border-green-100"
          >
            <Shield className="mx-auto mb-3 text-green-600" size={40} />
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Stay Secure</h3>
            <p className="text-gray-600 text-sm">
              Never share personal information like passwords or financial details during chats.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="p-6 bg-yellow-50 rounded-2xl shadow-sm border border-yellow-100"
          >
            <Users className="mx-auto mb-3 text-yellow-600" size={40} />
            <h3 className="font-semibold text-lg mb-2 text-gray-800">Build Connections</h3>
            <p className="text-gray-600 text-sm">
              Engage meaningfully. Peer2Chat helps you connect with real people for authentic conversations.
            </p>
          </motion.div>
        </div>
      </section>

        {/* Footer */}
        <footer className="text-center py-6 text-gray-500 text-sm border-t border-gray-200 bg-white/60 backdrop-blur-md">
          © {new Date().getFullYear()} Peer2Chat — Built for Real Connections 💙
        </footer>
        </div>
      </div>
    </div>
  );
};
