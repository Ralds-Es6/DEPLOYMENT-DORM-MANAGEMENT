import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = () => {
  const { user } = useAuth();
  
  if (!user) {
    // Redirect to appropriate page based on whether they tried to access admin or user route
    const path = window.location.pathname;
    if (path.includes('/admin') || path.includes('/rooms/manage') || path.includes('/user-management')) {
      return <Navigate to="/admin/login" />;
    }
    return <Navigate to="/" />;
  }
  
  return (
    <div className="text-gray-800">
      <Outlet />
    </div>
  );
};

export default PrivateRoute;