import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegistrationVerificationModal from '../components/RegistrationVerificationModal';
import toast from 'react-hot-toast';

const Register = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const handleRegistrationComplete = async (userData) => {
    try {
      // Store user info and token
      const userInfo = {
        _id: userData._id,
        userId: userData.userId,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        status: userData.status,
        isEmailVerified: userData.isEmailVerified,
        token: userData.token,
        isAdmin: false
      };

      // Update localStorage
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      localStorage.removeItem('adminInfo');

      // Update AuthContext
      updateUser(userInfo);

      toast.success('Account created successfully! Redirecting to dashboard...');
      
      // Navigate immediately
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message || 'Failed to complete registration');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      {/* Registration Verification Modal - Opens Immediately */}
      <RegistrationVerificationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onRegistrationComplete={handleRegistrationComplete}
      />
    </div>
  );
};

export default Register;