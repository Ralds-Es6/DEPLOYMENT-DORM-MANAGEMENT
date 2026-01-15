import { BrowserRouter } from 'react-router-dom';
import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import AppRouter from './routes/AppRouter';
import './App.css';

function AppContent() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {isAuthenticated ? (
        <div className="h-screen w-screen flex overflow-hidden bg-gray-50/50">
          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div className={`
            fixed lg:static inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
            <Sidebar onClose={() => setIsSidebarOpen(false)} />
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0 w-full relative">
            {/* Mobile Header */}
            <div className="lg:hidden bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-30">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <span className="font-display font-bold text-lg text-gray-900">KARMIN'S DORMITORY</span>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>

            <Toaster
              position="top-right"
              reverseOrder={false}
              gutter={8}
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#000',
                },
                success: {
                  style: {
                    background: '#fff',
                    color: '#000',
                    borderLeft: '4px solid #10b981',
                  },
                },
                error: {
                  style: {
                    background: '#fff',
                    color: '#000',
                    borderLeft: '4px solid #ef4444',
                  },
                },
              }}
            />
            <main className="flex-1 overflow-auto scroll-smooth">
              <div className="h-full p-4 md:p-8 max-w-7xl mx-auto w-full">
                <AppRouter />
              </div>
            </main>
            <div className="hidden lg:block">
              <Footer />
            </div>
            <ChatWidget />
          </div>
        </div>
      ) : (
        <div className="h-screen w-screen overflow-auto bg-gray-50">
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#000',
              },
              success: {
                style: {
                  background: '#fff',
                  color: '#000',
                  borderLeft: '4px solid #10b981',
                },
              },
              error: {
                style: {
                  background: '#fff',
                  color: '#000',
                  borderLeft: '4px solid #ef4444',
                },
              },
            }}
          />
          <AppRouter />
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
