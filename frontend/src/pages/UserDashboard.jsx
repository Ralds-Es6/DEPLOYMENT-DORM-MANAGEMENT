import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRooms } from '../api/roomService';
import { getAssignments, checkoutAssignment } from '../api/assignmentService';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import PaymentModal from '../components/PaymentModal';
import {
  HomeIcon,
  KeyIcon,
  UserCircleIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const UserDashboard = () => {
  const [stats, setStats] = useState({
    availableRooms: 0,
    myCurrentRoom: null,
  });
  const [pendingRequest, setPendingRequest] = useState(null);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [checkInHistory, setCheckInHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState({ isOpen: false, isWithin24Hours: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [rooms, assignments] = await Promise.all([
        getRooms(),
        getAssignments()
      ]);

      const pending = assignments.find(
        a => a.requestedBy?._id === user._id && ['pending', 'awaiting_payment', 'verification_pending', 'payment_pending'].includes(a.status)
      );
      const history = assignments.filter(
        a => a.requestedBy?._id === user._id && ['pending', 'approved', 'active', 'completed', 'rejected', 'cancelled', 'awaiting_payment', 'verification_pending', 'payment_pending'].includes(a.status)
      );
      setPendingRequest(pending);
      setCheckInHistory(history);

      const availableRooms = rooms.filter(room => room.status === 'available');

      const current = assignments.find(a =>
        a.requestedBy?._id === user._id &&
        ['approved', 'active'].includes(a.status)
      );
      setCurrentAssignment(current || null);

      setStats({
        availableRooms: availableRooms.length,
        myCurrentRoom: current?.room || null
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!currentAssignment) return;

    const approvalTime = new Date(currentAssignment.approvalTime || currentAssignment.createdAt);
    const now = new Date();
    const diffHours = Math.abs(now - approvalTime) / 36e5;
    const isWithin24Hours = diffHours <= 24;

    setShowConfirmation({
      isOpen: true,
      isWithin24Hours
    });
  };

  const handleConfirmAction = async () => {
    try {
      setIsProcessing(true);
      // If within 24 hours, it's a cancellation (which might have different logic in backend, 
      // but for now we use the same checkout endpoint or a cancel endpoint if available.
      // Assuming checkoutAssignment handles both or we just call it checkout for now)
      await checkoutAssignment(currentAssignment._id);

      toast.success(showConfirmation.isWithin24Hours ? 'Booking cancelled successfully' : 'Successfully checked out from room');
      setShowConfirmation({ isOpen: false, isWithin24Hours: false });
      await fetchDashboardData();
    } catch (err) {
      toast.error(err.message || 'Failed to process request');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getFilteredHistory = () => {
    let filtered = checkInHistory;

    if (filterType === 'active') {
      filtered = filtered.filter(a => a.status === 'active' || a.status === 'approved');
    } else if (filterType === 'completed') {
      filtered = filtered.filter(a => a.status === 'completed' || a.status === 'rejected' || a.status === 'cancelled');
    } else if (filterType === 'pending') {
      filtered = filtered.filter(a => a.status === 'pending');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(assignment =>
        assignment.referenceNumber?.toLowerCase().includes(query) ||
        assignment.room?.number?.toString().toLowerCase().includes(query) ||
        assignment.status?.toLowerCase().includes(query) ||
        (assignment.approvalTime && new Date(assignment.approvalTime).toLocaleString().toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const getPaginatedData = () => {
    const filtered = getFilteredHistory();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      data: filtered.slice(startIndex, endIndex),
      totalPages,
      totalItems: filtered.length,
      currentPage
    };
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    const { totalPages } = getPaginatedData();
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm">
          <p className="font-medium flex items-center gap-2">
            <XCircleIcon className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Welcome Back!</h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your dormitory status.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">ID: {user?.userId || 'N/A'}</p>
          </div>
        </div>
      </div>

      {pendingRequest && (
        <div className={`border rounded-2xl p-6 shadow-sm animate-slide-up ${pendingRequest.status === 'awaiting_payment' ? 'bg-blue-50 border-blue-100' :
          pendingRequest.status === 'verification_pending' ? 'bg-purple-50 border-purple-100' :
            pendingRequest.status === 'payment_pending' ? 'bg-orange-50 border-orange-100' :
              'bg-yellow-50 border-yellow-100'
          }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${pendingRequest.status === 'awaiting_payment' ? 'bg-blue-100' :
                pendingRequest.status === 'verification_pending' ? 'bg-purple-100' :
                  pendingRequest.status === 'payment_pending' ? 'bg-orange-100' :
                    'bg-yellow-100'
                }`}>
                <ClockIcon className={`w-6 h-6 ${pendingRequest.status === 'awaiting_payment' ? 'text-blue-600' :
                  pendingRequest.status === 'verification_pending' ? 'text-purple-600' :
                    pendingRequest.status === 'payment_pending' ? 'text-orange-600' :
                      'text-yellow-600'
                  }`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${pendingRequest.status === 'awaiting_payment' ? 'text-blue-800' :
                  pendingRequest.status === 'verification_pending' ? 'text-purple-800' :
                    pendingRequest.status === 'payment_pending' ? 'text-orange-800' :
                      'text-yellow-800'
                  }`}>
                  {pendingRequest.status === 'awaiting_payment' ? 'Payment Required' :
                    pendingRequest.status === 'verification_pending' ? 'Payment Verification in Progress' :
                      pendingRequest.status === 'payment_pending' ? 'Cash Payment Pending' :
                        'Pending Check-in Request'}
                </h3>
                <p className={`mt-1 ${pendingRequest.status === 'awaiting_payment' ? 'text-blue-700' :
                  pendingRequest.status === 'verification_pending' ? 'text-purple-700' :
                    pendingRequest.status === 'payment_pending' ? 'text-orange-700' :
                      'text-yellow-700'
                  }`}>
                  {pendingRequest.status === 'awaiting_payment'
                    ? `You have booked Room ${pendingRequest.room.number}. Please complete payment to proceed.`
                    : pendingRequest.status === 'verification_pending'
                      ? `We are verifying your payment for Room ${pendingRequest.room.number}. This usually takes 24 hours.`
                      : pendingRequest.status === 'payment_pending'
                        ? `Please pay at the admin office for Room ${pendingRequest.room.number} (Ref: ${pendingRequest.referenceNumber}).`
                        : `Your request for Room ${pendingRequest.room.number} is awaiting admin approval.`}
                </p>
              </div>
            </div>

            {(pendingRequest.status === 'awaiting_payment' || pendingRequest.status === 'payment_pending') && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className={`whitespace-nowrap px-6 py-2.5 font-medium rounded-xl shadow-sm transition-all active:scale-95 ${pendingRequest.status === 'awaiting_payment'
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200'
                  : 'bg-white text-orange-600 border border-orange-200 hover:bg-orange-50'
                  }`}
              >
                {pendingRequest.status === 'awaiting_payment' ? 'Pay Now' : 'Pay via GCash'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {pendingRequest && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          booking={pendingRequest}
          onSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Room Status */}
        <div className="card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-primary-500" />
                My Room
              </h3>
              {stats.myCurrentRoom && (
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Active
                </span>
              )}
            </div>

            {stats.myCurrentRoom ? (
              <div className="space-y-4">
                <div>
                  <p className="text-4xl font-bold text-gray-900">
                    Room {stats.myCurrentRoom.number}
                  </p>
                  <p className="text-gray-500 mt-1">
                    {stats.myCurrentRoom.type} • Floor {stats.myCurrentRoom.floor}
                  </p>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className={`w-full py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 group/btn ${(() => {
                    const approvalTime = new Date(currentAssignment.approvalTime || currentAssignment.createdAt);
                    const now = new Date();
                    const diffHours = Math.abs(now - approvalTime) / 36e5;
                    return diffHours <= 24
                      ? 'bg-orange-50 text-orange-600 hover:bg-orange-100'
                      : 'bg-red-50 text-red-600 hover:bg-red-100';
                  })()
                    }`}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  {isProcessing ? 'Processing...' : (
                    (() => {
                      const approvalTime = new Date(currentAssignment.approvalTime || currentAssignment.createdAt);
                      const now = new Date();
                      const diffHours = Math.abs(now - approvalTime) / 36e5;
                      return diffHours <= 24 ? 'Cancel Booking' : 'Check Out';
                    })()
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyIcon className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">No room currently assigned</p>
                <button
                  onClick={() => window.location.href = '/rooms'}
                  className="mt-4 text-primary-600 font-medium hover:text-primary-700 text-sm"
                >
                  Browse Available Rooms →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Available Rooms */}
        <div className="card p-6 relative overflow-hidden group cursor-pointer hover:border-primary-200 transition-colors" onClick={() => window.location.href = '/rooms'}>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>

          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5 text-secondary-500" />
                Available Rooms
              </h3>
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" />
            </div>

            <div>
              <p className="text-4xl font-bold text-gray-900">{stats.availableRooms}</p>
              <p className="text-gray-500 mt-1">Ready for booking</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-primary-600 group-hover:text-primary-700 flex items-center gap-1">
                View all rooms <ChevronRightIcon className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in History */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              Check-in History
            </h3>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search history..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64"
                />
              </div>

              <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                {['all', 'active', 'pending', 'completed'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize whitespace-nowrap ${filterType === type
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    {type === 'completed' ? 'History' : type === 'pending' ? 'Pending' : type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {getFilteredHistory().length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference #</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-in</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-out</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {getPaginatedData().data.map((assignment) => {
                      const checkInDate = assignment.checkInTime || assignment.approvalTime;
                      const checkOutDate = assignment.checkOutTime;
                      const duration = checkOutDate && checkInDate
                        ? Math.floor((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)) + ' days'
                        : 'Ongoing';

                      return (
                        <tr key={assignment._id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100 font-mono">
                              {assignment.referenceNumber || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 group-hover:border-gray-300 transition-colors">
                              Room {assignment.room.number}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {assignment.requestedBy?.mobileNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${(assignment.status === 'active' || assignment.status === 'approved')
                              ? 'bg-green-50 text-green-700 border-green-100'
                              : assignment.status === 'completed'
                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                : assignment.status === 'rejected'
                                  ? 'bg-red-50 text-red-700 border-red-100'
                                  : assignment.status === 'cancelled'
                                    ? 'bg-orange-50 text-orange-700 border-orange-100'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                              }`}>
                              {(assignment.status === 'active' || assignment.status === 'approved') ? 'Checked In' : assignment.status === 'completed' ? 'Check-out' : assignment.status === 'rejected' ? 'Rejected' : assignment.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(assignment.status === 'rejected' || assignment.status === 'cancelled') ? (
                              <span className="text-xs text-gray-400 italic">N/A</span>
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{formatDateTime(checkInDate).split(',')[0]}</span>
                                <span className="text-xs text-gray-400">{formatDateTime(checkInDate).split(',')[1]}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(assignment.status === 'rejected' || assignment.status === 'cancelled') ? (
                              <span className="text-xs text-gray-400 italic">N/A</span>
                            ) : checkOutDate ? (
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">{formatDateTime(checkOutDate).split(',')[0]}</span>
                                <span className="text-xs text-gray-400">{formatDateTime(checkOutDate).split(',')[1]}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {(assignment.status === 'rejected' || assignment.status === 'cancelled') ? (
                              <span className="text-xs text-gray-400 italic">N/A</span>
                            ) : (
                              duration
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {getPaginatedData().data.map((assignment) => {
                  const checkInDate = assignment.checkInTime || assignment.approvalTime;
                  const checkOutDate = assignment.checkOutTime;
                  const duration = checkOutDate && checkInDate
                    ? Math.floor((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)) + ' days'
                    : 'Ongoing';

                  return (
                    <div key={assignment._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reference #</span>
                          <p className="font-mono text-sm font-bold text-primary-600">{assignment.referenceNumber || 'N/A'}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${(assignment.status === 'active' || assignment.status === 'approved')
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : assignment.status === 'completed'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : assignment.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : assignment.status === 'cancelled'
                                ? 'bg-orange-50 text-orange-700 border-orange-100'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                          }`}>
                          {(assignment.status === 'active' || assignment.status === 'approved') ? 'Checked In' : assignment.status === 'completed' ? 'Check-out' : assignment.status === 'rejected' ? 'Rejected' : assignment.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Room</span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            Room {assignment.room.number}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Mobile</span>
                          <span className="text-sm font-medium text-gray-900">
                            {assignment.requestedBy?.mobileNumber || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Duration</span>
                          <span className="text-sm font-medium text-gray-900">
                            {(assignment.status === 'rejected' || assignment.status === 'cancelled') ? 'N/A' : duration}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Check-in</span>
                          {(assignment.status === 'rejected' || assignment.status === 'cancelled') ? (
                            <span className="text-xs text-gray-400 italic">N/A</span>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-medium text-sm text-gray-900">{formatDateTime(checkInDate).split(',')[0]}</span>
                              <span className="text-xs text-gray-400">{formatDateTime(checkInDate).split(',')[1]}</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block mb-1">Check-out</span>
                          {(assignment.status === 'rejected' || assignment.status === 'cancelled') ? (
                            <span className="text-xs text-gray-400 italic">N/A</span>
                          ) : checkOutDate ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-sm text-gray-900">{formatDateTime(checkOutDate).split(',')[0]}</span>
                              <span className="text-xs text-gray-400">{formatDateTime(checkOutDate).split(',')[1]}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">-</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No records found</p>
              <p className="text-sm text-gray-400">Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {getFilteredHistory().length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{((getPaginatedData().currentPage - 1) * itemsPerPage) + 1}</span> to <span className="font-medium text-gray-900">{Math.min(getPaginatedData().currentPage * itemsPerPage, getPaginatedData().totalItems)}</span> of <span className="font-medium text-gray-900">{getPaginatedData().totalItems}</span> records
            </p>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage >= getPaginatedData().totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation.isOpen}
        title={showConfirmation.isWithin24Hours ? "Cancel Booking?" : "Confirm Check-Out?"}
        message={showConfirmation.isWithin24Hours
          ? "You are within the 24-hour grace period. You can cancel your booking now without penalty."
          : "Check-out after 24 hours is allowed, but cancellations are not refundable. Are you sure you want to proceed?"}
        onConfirm={handleConfirmAction}
        onCancel={() => setShowConfirmation({ isOpen: false, isWithin24Hours: false })}
        confirmText={showConfirmation.isWithin24Hours ? "Yes, Cancel Booking" : "Yes, Check Out"}
        cancelText="No, Keep Room"
        isLoading={isProcessing}
        variant={showConfirmation.isWithin24Hours ? "warning" : "danger"}
      />
    </div>
  );
};

export default UserDashboard;