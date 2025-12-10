import { createContext, useContext, useState } from 'react';
import api from '../api/apiConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Check for admin first, then regular user
    const savedAdmin = localStorage.getItem('adminInfo');
    const savedUser = localStorage.getItem('userInfo');
    if (savedAdmin) {
      return JSON.parse(savedAdmin);
    }
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/users/login', { email, password });

      // Store the entire response including token
      setUser(data);

      // Store in separate keys based on user type to prevent cross-tab conflicts
      if (data.isAdmin) {
        localStorage.setItem('adminInfo', JSON.stringify(data));
        // Clear regular user info if it exists
        localStorage.removeItem('userInfo');
      } else {
        localStorage.setItem('userInfo', JSON.stringify(data));
        // Clear admin info if it exists
        localStorage.removeItem('adminInfo');
      }

      return data; // Return the data for components to check user type
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    // Clear both admin and user info
    localStorage.removeItem('userInfo');
    localStorage.removeItem('adminInfo');
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const register = async (name, email, password, mobileNumber) => {
    setLoading(true);
    try {
      const { data } = await api.post('/users', { name, email, password, mobileNumber });

      setUser(data);

      // Store in separate keys based on user type to prevent cross-tab conflicts
      if (data.isAdmin) {
        localStorage.setItem('adminInfo', JSON.stringify(data));
        localStorage.removeItem('userInfo');
      } else {
        localStorage.setItem('userInfo', JSON.stringify(data));
        localStorage.removeItem('adminInfo');
      }
      return data; // Return the data to let the component handle success
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};