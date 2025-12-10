import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { userService } from '../api/userService';

export default function ForgotPasswordModal({ isOpen, onClose, onCodeVerified }) {
  const [step, setStep] = useState('email'); // 'email', 'code'
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setResetCode('');
    setUserId('');
    setError('');
    setSuccessMessage('');
    setResendCountdown(0);
    onClose();
  };

  // Step 1: User enters email to request reset code
  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await userService.requestPasswordReset(email);
      
      setUserId(response.userId);
      setStep('code');
      setSuccessMessage('✓ Verification code sent to your email!');
      setResendCountdown(60);
    } catch (err) {
      // Check if it's an account not found error
      if (err.message && err.message.includes('Account not found')) {
        setError('Account not found - this email is not registered in our system');
      } else {
        setError(err.message || 'Failed to send reset code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: User enters reset code for verification
  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!resetCode.trim()) {
      setError('Please enter the verification code from your email');
      return;
    }

    if (resetCode.length !== 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verify code only (without password)
      await userService.verifyPasswordResetCode({
        userId,
        resetCode
      });

      // Show success message
      setSuccessMessage('✓ Verification code verified successfully! Proceeding to password reset...');
      
      setTimeout(() => {
        // If code is verified, pass data to parent and open reset password modal
        onCodeVerified({
          userId,
          email,
          resetCode
        });

        handleClose();
      }, 1500);
    } catch (err) {
      const errorMessage = err.message || 'Failed to verify code. Please try again.';
      
      // Check if it's a "too many attempts" error
      if (errorMessage.includes('Too many') || errorMessage.includes('429')) {
        setError('Too many attempts. Please try again later. Redirecting...');
        setTimeout(() => {
          // Reset to email step
          setStep('email');
          setResetCode('');
          setUserId('');
          setError('');
          setSuccessMessage('');
          setResendCountdown(0);
        }, 2000);
      } else if (errorMessage.includes('Invalid reset code') || errorMessage.includes('expired')) {
        setError(errorMessage + ' Please try again.');
        setTimeout(() => {
          // Reset to email step
          setStep('email');
          setResetCode('');
          setUserId('');
          setError('');
          setSuccessMessage('');
          setResendCountdown(0);
        }, 2000);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      await userService.resendPasswordResetCode(userId);
      setSuccessMessage('New reset code sent to your email!');
      setResetCode('');
      setResendCountdown(60);
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              {step === 'email' ? 'Recover Account' : 'Verify Code'}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {step === 'email' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'email' ? (
            // STEP 1: Enter Email
            <form onSubmit={handleRequestReset}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Your Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="your.email@gmail.com"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll send a 6-digit verification code to this email
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors"
              >
                {loading ? 'Sending Code...' : 'Send Verification Code'}
              </button>

              <p className="text-sm text-gray-600 text-center mt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Back to Sign In
                </button>
              </p>
            </form>
          ) : (
            // STEP 2: Enter Verification Code
            <form onSubmit={handleVerifyCode}>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  A verification code has been sent to <span className="font-semibold">{email}</span>
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code (6 digits)
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={resetCode}
                  onChange={(e) => {
                    setResetCode(e.target.value.replace(/\D/g, ''));
                    setError('');
                  }}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="000000"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Code expires in 5 minutes</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">⚠️ {error}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors mb-3"
              >
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div className="text-center mb-3">
                <p className="text-sm text-gray-600 mb-2">Didn't receive the code?</p>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCountdown > 0 || loading}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setResetCode('');
                  setError('');
                  setSuccessMessage('');
                  setResendCountdown(0);
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 rounded-lg transition-colors"
              >
                Use Different Email
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
