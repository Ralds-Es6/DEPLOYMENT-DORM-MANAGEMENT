import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  HomeIcon,
  BuildingOfficeIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  UsersIcon,
  DocumentChartBarIcon,
  DocumentTextIcon,
  PrinterIcon,
  UserCircleIcon,
  PencilSquareIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon,
  XMarkIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Sidebar = ({ onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState(null);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const isMenuOpen = (menuName) => {
    return expandedMenu === menuName;
  };

  const toggleMenu = (menuName) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  // Define navigation items based on user role
  const baseAdminItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/rooms/manage', label: 'Manage Rooms', icon: BuildingOfficeIcon },
    { path: '/checkin-history', label: 'Check-in History', icon: ClipboardDocumentCheckIcon },
    { path: '/pending-checkins', label: 'Pending Check-ins', icon: ClockIcon },
    { path: '/user-management', label: 'User Management', icon: UsersIcon },
    {
      label: 'Report Management',
      icon: DocumentChartBarIcon,
      isDropdown: true,
      submenu: [
        { path: '/report-management', label: 'Operations Report', icon: DocumentTextIcon },
        { path: '/print-report', label: 'Print Reports', icon: PrinterIcon },
      ]
    },
  ];

  // Only add Settings to super admin
  const adminNavItems = user?.isSuperAdmin
    ? [...baseAdminItems, { path: '/settings', label: 'Settings', icon: Cog6ToothIcon }]
    : baseAdminItems;

  const userNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/rooms', label: 'Available Rooms', icon: BuildingOfficeIcon },
    { path: '/profile', label: 'My Profile', icon: UserCircleIcon },
    { path: '/submit-report', label: 'Submit Report', icon: PencilSquareIcon },
  ];

  if (!user) return null;

  const navItems = user.isAdmin ? adminNavItems : userNavItems;

  const handleLogoutClick = () => {
    toast.custom((t) => (
      <div className="bg-white rounded-xl shadow-2xl p-4 border-l-4 border-amber-500 max-w-sm animate-in flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900">Confirm Logout?</h3>
            <p className="text-sm text-gray-600 mt-1">You'll need to login again to access your account.</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              logout();
            }}
            className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg transition-all font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    ), {
      position: 'bottom-right',
      duration: Infinity
    });
  };

  return (
    <div className="h-full flex flex-col bg-white/80 backdrop-blur-xl border-r border-white/20 shadow-xl">
      <div className="p-6 border-b border-gray-100/50 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-200">
            <BuildingOfficeIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-display font-bold text-gray-900 text-lg leading-tight">Dorm</h1>
            <p className="text-xs text-primary-600 font-medium tracking-wide">MANAGEMENT</p>
          </div>
        </Link>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (item.isDropdown) {
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isMenuOpen(item.label)
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <div className="flex items-center">
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${isMenuOpen(item.label) ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                    />
                    {item.label}
                  </div>
                  <ChevronDownIcon
                    className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${isMenuOpen(item.label) ? 'rotate-180 text-primary-500' : 'text-gray-400'
                      }`}
                  />
                </button>
                <div
                  className={`space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen(item.label) ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                  {item.submenu?.map((subitem) => {
                    const SubIcon = subitem.icon;
                    return (
                      <Link
                        key={subitem.path}
                        to={subitem.path}
                        onClick={onClose}
                        className={`flex items-center pl-11 pr-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive(subitem.path)
                          ? 'text-primary-600 bg-primary-50/50'
                          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                      >
                        {SubIcon && <SubIcon className="w-4 h-4 mr-2 opacity-70" />}
                        {subitem.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${isActive(item.path)
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <Icon
                className={`mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200 ${isActive(item.path) ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100/50 bg-gray-50/50 backdrop-blur-sm m-4 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-lg border-2 border-white shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl text-gray-600 bg-white hover:bg-gray-50 hover:text-red-600 hover:border-red-100 transition-all duration-200 shadow-sm group"
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2 text-gray-400 group-hover:text-red-500 transition-colors" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;