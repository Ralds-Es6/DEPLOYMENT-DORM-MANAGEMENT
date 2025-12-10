import { useState } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';

const TermsAndConditionsModal = ({ isOpen, onClose, onAgree }) => {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [idImage, setIdImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      setIdImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAgree = () => {
    if (agreedToTerms && idImage) {
      setAgreedToTerms(false);
      onAgree(idImage);
    }
  };

  const handleClose = () => {
    setAgreedToTerms(false);
    setIdImage(null);
    setPreviewUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slide-up flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-600 px-6 py-6 flex items-center justify-between border-b border-primary-700/20">
          <div>
            <h2 className="text-2xl font-display font-bold text-white mb-1">Terms and Conditions</h2>
            <p className="text-primary-100 text-sm">Please read carefully before proceeding</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="space-y-5 text-gray-700 leading-relaxed">
            <p className="text-base font-medium text-gray-900 mb-6">
              By submitting a room booking through this system, you agree to the following Terms and Conditions:
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                    1
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Accuracy of Information</h3>
                  <p className="text-sm text-gray-600">
                    When you book a room, you confirm that all information you provide is true, accurate, and complete. Any incorrect or misleading information may result in delays, cancellation of your booking, or denial of check-in.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                    2
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Subject to Review and Approval</h3>
                  <p className="text-sm text-gray-600">
                    You understand that your booking request is subject to review and approval by the dormitory management. A reservation is not considered final until it has been verified and confirmed by the administration.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                    3
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Compliance with Rules and Payment</h3>
                  <p className="text-sm text-gray-600">
                    You agree to comply with all dormitory rules, policies, and payment schedules. Any required fees or deposits must be paid within the specified timeframe; otherwise, your reservation may be canceled without further notice.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                    4
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Personal Information and Data Privacy</h3>
                  <p className="text-sm text-gray-600">
                    By proceeding with the booking, you authorize the dormitory to collect and store your personal information, including your name, contact details, and booking details, solely for processing your reservation, managing your stay, and maintaining official dormitory records. Your information will not be shared with unauthorized third parties.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                    5
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Prohibited Misuse</h3>
                  <p className="text-sm text-gray-600">
                    You agree not to misuse the booking system in any way, including submitting fraudulent bookings, attempting to bypass system restrictions, or interfering with the functionality of the platform. Any misuse may lead to cancellation of your reservation or suspension from the system.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                    6
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Room Availability and Modifications</h3>
                  <p className="text-sm text-gray-600">
                    All reservations are subject to room availability and may be adjusted when necessary. The dormitory reserves the right to modify or cancel bookings in cases of operational issues, maintenance, or violations of dormitory policies.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                    7
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Acknowledgment and Responsibility</h3>
                  <p className="text-sm text-gray-600">
                    By completing your booking, you acknowledge that you have read, understood, and agreed to these Terms and Conditions, and you accept full responsibility for complying with all dormitory guidelines during your stay.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
                    8
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Cancellation and Check-Out Policy</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Within 24 Hours of Approval:</strong> You may cancel your booking within 24 hours of check-in approval.
                    <br />
                    <strong>After 24 Hours:</strong> Cancellations are no longer refundable. You may only proceed with Check-Out.
                  </p>
                </div>
              </div>
            </div>

            {/* Identity Verification Section */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DocumentArrowUpIcon className="w-5 h-5 text-primary-600" />
                Identity Verification
              </h3>
              
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  To ensure the security of our dormitory, we require a valid government-issued ID or school ID for verification purposes. Please upload a clear image of your ID.
                </p>

                <div className="space-y-4">
                  {!previewUrl ? (
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-primary-500 transition-colors bg-white">
                      <div className="space-y-1 text-center">
                        <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="id-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                          >
                            <span>Upload a file</span>
                            <input
                              id="id-upload"
                              name="id-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-white p-2">
                      <div className="flex items-center justify-between mb-2 px-2">
                        <span className="text-sm font-medium text-gray-700">Selected ID</span>
                        <button
                          onClick={() => {
                            setIdImage(null);
                            setPreviewUrl(null);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      <img
                        src={previewUrl}
                        alt="ID Preview"
                        className="w-full h-48 object-contain bg-gray-50 rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
            <ExclamationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              <span className="font-medium">Important:</span> You must read and agree to these terms before proceeding with your room booking.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-xl">
            <input
              type="checkbox"
              id="terms-agreement"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
            />
            <label htmlFor="terms-agreement" className="text-sm font-medium text-gray-900 cursor-pointer">
              I have read and agree to all Terms and Conditions
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAgree}
              disabled={!agreedToTerms || !idImage}
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              Continue to Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;
