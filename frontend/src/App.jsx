import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { HomePage } from './pages/HomePage.jsx';
import { RegisterPage } from './components/auth/RegisterPage.jsx';
import { VerifyOtpPage } from './components/auth/VerifyOtpPage.jsx';
import { LoginPage } from './components/auth/LoginPage.jsx';
import { ChatPage } from './pages/ChatPage.jsx';
import { ProtectedRoute } from './routes/ProtectedROutes.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import { TermsPage } from "./components/common/TermsPage.jsx"
import { GroupChat } from './pages/GroupChat.jsx';

const DeveloperPage = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
    <div className="h-16" />
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Meet the Developer (This page is under construction)</h1>
      <p className="text-gray-600 mb-6">Hi! This page will showcase the developer, project vision, and links.</p>
      <div className="space-x-3">
        <Link to="/chat" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Go to Chat</Link>
        <Link to="/" className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Home</Link>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/login' element={<LoginPage />} />

        {/* typically unprotected during onboarding */}
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/verify-otp' element={<VerifyOtpPage />} />
        <Route path='/terms' element={<TermsPage />}/>

        {/* protected */}
        <Route
          path='/chat'
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/group-chat'
          element={
            <ProtectedRoute>
              <GroupChat />
            </ProtectedRoute>
          }
        />
        <Route
          path='/profile'
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* public */}
        <Route path='/developer' element={<DeveloperPage />} />
      </Routes>
    </Router>
  );
}

export default App;