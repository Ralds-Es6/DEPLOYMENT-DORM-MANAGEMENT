import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import ResetPasswordModal from '../components/ResetPasswordModal';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ArrowRightIcon,
  HomeModernIcon,
  CheckBadgeIcon,
  UserCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const UserLanding = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userData = await login(email, password);
      // Verify this is NOT an admin
      if (userData && userData.isAdmin) {
        // Logout if admin tries to login here
        logout();
        throw new Error('Please use admin login page for admin accounts.');
      }
      toast.success('Successfully logged in!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to login');
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed w-full z-50 transition-all duration-300 bg-white/70 backdrop-blur-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                <BuildingOfficeIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-gray-900 leading-tight">KARMIN'S</h1>
                <p className="text-xs text-primary-600 font-medium tracking-wide">DORMITORY</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="px-6 py-2.5 text-gray-600 hover:text-primary-600 font-medium transition-colors"
              >
                {showLogin ? 'Hide Login' : 'Sign In'}
              </button>
              <Link
                to="/register"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Content */}
            <div className="text-center lg:text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white/50 shadow-sm backdrop-blur-sm mb-8 animate-fade-in">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                <span className="text-sm font-medium text-gray-600">Now accepting new applications</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-display font-bold text-gray-900 leading-[1.1] mb-6 animate-slide-up">
                Find Your Perfect
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600"> Dorm Room</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-10 max-w-2xl mx-auto lg:mx-0 animate-slide-up animate-delay-100">
                Experience modern dormitory living with our seamless management system.
                View rooms, check status, and manage your stay - all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up animate-delay-200">
                <button
                  onClick={() => setShowLogin(true)}
                  className="btn-primary text-lg px-8 py-4 shadow-xl shadow-primary-500/20"
                >
                  User Login
                </button>
                <Link
                  to="/register"
                  className="btn-secondary text-lg px-8 py-4"
                >
                  Create Account
                </Link>
              </div>
            </div>

            {/* Right Side - Login Form (shown when showLogin is true) */}
            <div className={`transition-all duration-500 ease-out transform ${showLogin ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none hidden lg:block'}`}>
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-primary-500/10 p-8 border border-white/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100 to-transparent rounded-bl-full opacity-50"></div>

                <div className="relative z-10">
                  <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Welcome Back</h2>
                  <p className="text-gray-500 mb-8">Please enter your details to sign in.</p>

                  <form onSubmit={handleLogin} className="space-y-5">
                    {error && (
                      <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3">
                        <XMarkIcon className="w-5 h-5 text-red-500 mt-0.5" />
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="input-field"
                          placeholder="user@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="input-field"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                        <span className="ml-2 text-sm text-gray-600">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLogin(false);
                          setShowForgotPassword(true);
                        }}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary py-3 text-lg shadow-lg shadow-primary-500/25"
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <p className="text-center text-sm text-gray-600 pt-4">
                      Don't have an account?{' '}
                      <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                        Register now
                      </Link>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-24 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-gray-900 mb-4">Everything You Need</h2>
            <p className="text-lg text-gray-600">Streamline your dormitory experience with our comprehensive suite of tools designed for users.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-primary-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <HomeModernIcon className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Browse Rooms</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Explore available dormitory rooms with detailed information, photos, and pricing to find your perfect match.
              </p>
              <Link to="/browse-rooms" className="inline-flex items-center text-primary-600 font-semibold group-hover:gap-2 transition-all">
                View Rooms <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-secondary-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-secondary-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <CheckBadgeIcon className="w-8 h-8 text-secondary-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Check-in</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Seamless digital check-in process. Track your application status and view room assignments in real-time.
              </p>
              <span className="inline-flex items-center text-secondary-600 font-semibold cursor-default">
                Real-time Updates
              </span>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserCircleIcon className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Manage Profile</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Keep your personal information up to date, manage preferences, and view your history all in one secure place.
              </p>
              <span className="inline-flex items-center text-pink-600 font-semibold cursor-default">
                Secure & Private
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Login Modal */}
      {showLogin && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowLogin(false)}
          ></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">Sign In</h2>
              <button
                onClick={() => setShowLogin(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-50 p-4 border border-red-100 flex items-start gap-3">
                  <XMarkIcon className="w-5 h-5 text-red-500 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowLogin(false);
                    setShowForgotPassword(true);
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-3 text-lg shadow-lg shadow-primary-500/25"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <p className="text-center text-sm text-gray-600 pt-4">
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
                  Register now
                </Link>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          setShowLogin(true); // Return to login modal
        }}
        onCodeVerified={(data) => {
          // Code verified, now open reset password modal
          setVerificationData(data);
          setShowResetPassword(true);
        }}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={showResetPassword}
        onClose={() => {
          setShowResetPassword(false);
          setVerificationData(null);
        }}
        verificationData={verificationData}
        onPasswordReset={() => {
          toast.success('Password reset successfully! Please log in with your new password.');
          setShowResetPassword(false);
          setVerificationData(null);
          setShowLogin(true); // Return to login modal
          setEmail('');
          setPassword('');
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white">
                <BuildingOfficeIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-gray-900">KARMIN'S DORMITORY</h3>
                <p className="text-xs text-gray-500">SYSTEM</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} KARMIN'S DORMITORY. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserLanding;

