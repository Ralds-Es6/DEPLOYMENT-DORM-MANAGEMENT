import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  HomeModernIcon,
  UserGroupIcon,
  ClipboardDocumentCheckIcon,
  ShieldCheckIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 pt-16 pb-16 sm:pt-24 sm:pb-24 md:pt-32 lg:pt-40 lg:pb-40">
            <main>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-full text-primary-700 text-sm font-medium mb-8 animate-fade-in">
                  <SparklesIcon className="w-4 h-4" />
                  <span>Modern Dormitory Management System</span>
                </div>

                <h1 className="text-5xl tracking-tight font-display font-extrabold text-gray-900 sm:text-6xl md:text-7xl animate-fade-in">
                  <span className="block">Streamline Your</span>
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                    Dormitory Management
                  </span>
                </h1>

                <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 sm:text-xl md:text-2xl animate-fade-in animation-delay-100">
                  Efficiently manage your dormitory operations with our comprehensive management system.
                  Handle room assignments, student records, and maintenance requests all in one place.
                </p>

                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in animation-delay-200">
                  {user ? (
                    <Link
                      to="/dashboard"
                      className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                    >
                      Go to Dashboard
                      <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
                      >
                        Register as User
                        <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        to="/login"
                        className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                      >
                        Sign In
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Feature Section */}
      <div className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 border border-primary-100 rounded-full text-primary-700 text-sm font-medium mb-4">
              <SparklesIcon className="w-4 h-4" />
              <span>Features</span>
            </div>
            <h2 className="text-4xl font-display font-extrabold text-gray-900 sm:text-5xl">
              Everything you need to manage your dormitory
            </h2>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to make dormitory management effortless and efficient
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard
              title="Room Management"
              description="Browse available rooms, view detailed information, and submit check-in requests with ease. Real-time occupancy tracking keeps you informed."
              icon={HomeModernIcon}
              gradient="from-blue-500 to-blue-600"
            />
            <FeatureCard
              title="User Portal"
              description="Access your profile, view room status, manage assignments, and submit maintenance reports all from one convenient dashboard."
              icon={UserGroupIcon}
              gradient="from-purple-500 to-purple-600"
            />
            <FeatureCard
              title="Request Management"
              description="Streamlined check-in and check-out processes with automated approval workflows and instant notifications for status updates."
              icon={ClipboardDocumentCheckIcon}
              gradient="from-green-500 to-green-600"
            />
            <FeatureCard
              title="Admin Controls"
              description="Comprehensive admin dashboard with analytics, user management, room assignments, and detailed reporting capabilities."
              icon={ShieldCheckIcon}
              gradient="from-orange-500 to-orange-600"
            />
          </div>
        </div>
      </div>

      {/* Admin Section */}
      {!user && (
        <div className="py-20 bg-gray-50 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="card p-12 bg-gradient-to-br from-white to-gray-50 border border-gray-100">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-primary-600" />
              </div>

              <h2 className="text-3xl font-display font-extrabold text-gray-900 sm:text-4xl">
                For Administrators
              </h2>

              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                If you're a dormitory administrator, set up your admin account to manage the entire system with powerful tools and insights.
              </p>

              <div className="mt-8">
                <Link
                  to="/admin-setup"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-200"
                >
                  Set Up Admin Account
                  <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2024 Dormitory Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ title, description, icon: Icon, gradient }) => (
  <div className="group card p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 bg-white">
    <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
      <Icon className="w-7 h-7 text-white" />
    </div>
    <h3 className="text-xl font-display font-bold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default Home;