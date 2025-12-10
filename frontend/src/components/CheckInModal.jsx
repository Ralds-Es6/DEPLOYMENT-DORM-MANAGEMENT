import { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';
import {
  XMarkIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const CheckInModal = ({ room, isOpen, onClose, onConfirm }) => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateDuration = () => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Calculate days difference
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    return diffDays;
  };

  const calculateTotalPrice = () => {
    const days = calculateDuration();
    if (!room?.monthlyRate) return 0;
    
    // Calculate daily rate (Monthly Rate / 30)
    const dailyRate = room.monthlyRate / 30;
    return Math.round(dailyRate * days);
  };

  const handleDateChange = (value) => {
    if (Array.isArray(value)) {
      const [start, end] = value;
      setStartDate(start);
      setEndDate(end);
    } else {
      // Handle single date selection if range is not complete
      setStartDate(value);
      setEndDate(null);
    }
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
  };

  const handleConfirm = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }
    
    // Show confirmation modal instead of directly confirming
    setShowConfirmation(true);
  };

  const handleConfirmCheckIn = async () => {
    try {
      setIsSubmitting(true);
      
      // Format dates to YYYY-MM-DD using local timezone to avoid off-by-one errors
      const formatLocalDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      onConfirm({
        startDate: formatLocalDate(startDate),
        endDate: formatLocalDate(endDate),
        duration: calculateDuration(),
        totalPrice: calculateTotalPrice()
      });

      handleReset();
      setShowConfirmation(false);
    } catch (error) {
      toast.error('Failed to complete check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const duration = calculateDuration();
  const totalPrice = calculateTotalPrice();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full mix-blend-overlay filter blur-2xl transform translate-x-1/2 -translate-y-1/2"></div>

          <div className="flex items-center justify-between relative z-10">
            <div>
              <h2 className="text-2xl font-display font-bold text-white">Book Room {room?.number}</h2>
              <p className="text-primary-100 text-sm mt-1">Select your stay duration</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Room Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Room Type</p>
              <p className="text-gray-900 font-semibold">{room?.type}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Monthly Rate</p>
              <p className="text-primary-600 font-bold text-lg">₱{room?.monthlyRate?.toLocaleString()}</p>
            </div>
          </div>

          {/* Date Selection Instructions */}
          <div className="mb-4 p-3 rounded-lg border border-primary-100 bg-primary-50 text-primary-700 text-sm flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            <p>Select your check-in and check-out dates</p>
          </div>

          {/* Calendar */}
          <div className="mb-6 flex justify-center bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="react-calendar-wrapper w-full">
              <Calendar
                onChange={handleDateChange}
                value={startDate && endDate ? [startDate, endDate] : null}
                selectRange={true}
                minDate={new Date()}
                className="border-0 w-full font-sans"
              />
            </div>
          </div>

          {/* Selected Dates */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-xl border transition-all ${startDate ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-xs text-gray-500 font-medium uppercase mb-1">Check-in</p>
              <p className={`font-semibold ${startDate ? 'text-green-700' : 'text-gray-400'}`}>
                {startDate ? new Date(startDate).toLocaleDateString() : 'Select date'}
              </p>
            </div>
            <div className={`p-4 rounded-xl border transition-all ${endDate ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
              <p className="text-xs text-gray-500 font-medium uppercase mb-1">Check-out</p>
              <p className={`font-semibold ${endDate ? 'text-red-700' : 'text-gray-400'}`}>
                {endDate ? new Date(endDate).toLocaleDateString() : 'Select date'}
              </p>
            </div>
          </div>

          {/* Duration and Price Calculation */}
          {startDate && endDate && (
            <div className="mb-6 animate-fade-in">
              <div className="p-5 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl text-white shadow-lg">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-300 font-medium flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" /> Duration
                  </span>
                  <span className="text-lg font-bold">{duration} {duration === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="h-px bg-white/10 my-2"></div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 font-medium flex items-center gap-2">
                    <CurrencyDollarIcon className="w-4 h-4" /> Total Price
                  </span>
                  <span className="text-2xl font-bold text-primary-400">₱{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="p-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              title="Reset Selection"
            >
              <ArrowPathIcon className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!startDate || !endDate}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-600/20 disabled:shadow-none"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>

      {/* Custom styles for calendar */}
      <style>{`
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
          background: transparent;
        }
        .react-calendar__navigation button {
          color: #111827;
          min-width: 44px;
          background: none;
          font-size: 16px;
          margin-top: 8px;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #f3f4f6;
          border-radius: 8px;
        }
        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.75em;
          color: #6b7280;
          margin-bottom: 8px;
        }
        .react-calendar__tile {
          padding: 10px 6px;
          font-size: 0.9rem;
          border-radius: 8px;
          color: #374151;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile:enabled:focus {
          background-color: #eff6ff;
          color: #2563eb;
        }
        .react-calendar__tile--now {
          background-color: #fef3c7;
          color: #d97706;
          font-weight: bold;
        }
        .react-calendar__tile--active {
          background-color: #2563eb !important;
          color: white !important;
        }
        .react-calendar__tile--range {
          background-color: #eff6ff !important;
          color: #2563eb !important;
        }
        .react-calendar__tile--rangeStart,
        .react-calendar__tile--rangeEnd {
          background-color: #2563eb !important;
          color: white !important;
          border-radius: 8px !important;
        }
      `}</style>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title="Confirm Check-In?"
        message={`You're about to book Room ${room?.number} for ${duration} ${duration === 1 ? 'day' : 'days'} with a total of ₱${totalPrice.toLocaleString()}.`}
        onConfirm={handleConfirmCheckIn}
        onCancel={() => setShowConfirmation(false)}
        confirmText="Confirm Check-In"
        cancelText="Cancel"
        isLoading={isSubmitting}
        variant="success"
      />
    </div>
  );
};

export default CheckInModal;
