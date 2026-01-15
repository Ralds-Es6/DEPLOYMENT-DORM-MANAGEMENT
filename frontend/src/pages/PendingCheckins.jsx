import { useState, useEffect } from 'react';
import { getPendingAssignments, updateAssignment } from '../api/assignmentService';
import { getRooms } from '../api/roomService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import Modal from '../components/Modal';
import { MEDIA_BASE_URL } from '../api/apiConfig';
import {
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  InboxIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  IdentificationIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PhoneIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const PendingCheckins = () => {
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedIdImage, setSelectedIdImage] = useState(null);
  const { user } = useAuth();
  const itemsPerPage = 10;

  const fetchPendingAssignments = async () => {
    try {
      const data = await getPendingAssignments();
      // Filter out assignments where the user has been deleted
      const validAssignments = data.filter(assignment => assignment.requestedBy && assignment.requestedBy._id);
      setPendingAssignments(validAssignments);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch pending check-ins');
      toast.error('Failed to fetch pending check-ins');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = (assignmentId, approved, assignmentData) => {
    setConfirmationData({ assignmentId, approved, assignmentData });
    setShowConfirmation(true);
  };

  const handleConfirmApproval = async () => {
    try {
      setIsProcessing(true);
      const { assignmentId, approved } = confirmationData;
      const status = approved ? 'approved' : 'rejected';
      const notes = approved
        ? 'Your check-in request has been approved. Please proceed to the room.'
        : 'Your check-in request has been rejected. Please contact admin for more information.';

      await updateAssignment(assignmentId, { status, notes });

      // Refresh room data after approval/rejection
      if (approved) {
        await getRooms();
      }

      toast.success(`Check-in request ${status} successfully`);
      // Refresh the list after approval/rejection
      fetchPendingAssignments();
      setShowConfirmation(false);
    } catch (err) {
      setError(err.message || 'Failed to update check-in status');
      toast.error('Failed to update check-in status');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFilteredAssignments = () => {
    // First, filter out any assignments with missing user data
    const validAssignments = pendingAssignments.filter(assignment => assignment.requestedBy && assignment.requestedBy._id);

    if (!searchQuery.trim()) {
      return validAssignments;
    }

    const query = searchQuery.toLowerCase();
    return validAssignments.filter(assignment =>
      assignment.referenceNumber?.toLowerCase().includes(query) ||
      assignment.requestedBy?.name?.toLowerCase().includes(query) ||
      assignment.requestedBy?.email?.toLowerCase().includes(query) ||
      assignment.requestedBy?.userId?.toLowerCase().includes(query) ||
      assignment.room?.number?.toString().includes(query)
    );
  };

  useEffect(() => {
    fetchPendingAssignments();
  }, []);

  const filteredAssignments = getFilteredAssignments();
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssignments = filteredAssignments.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return '';
    return imagePath.startsWith('http')
      ? imagePath
      : `${MEDIA_BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Pending Requests</h1>
          <p className="text-gray-500 mt-1">Review and manage user check-in applications</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative group flex-1 sm:flex-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by ref #, name, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-72 shadow-sm transition-all"
            />
          </div>
          <div className="bg-white px-5 py-2.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3 whitespace-nowrap">
            <span className="text-sm font-medium text-gray-500">Total Pending</span>
            <div className="h-4 w-px bg-gray-200"></div>
            <span className="text-lg font-bold text-primary-600">{filteredAssignments.length}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm flex items-center gap-3 animate-fade-in">
          <XCircleIcon className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {pendingAssignments.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <InboxIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-display">No pending requests</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">All check-in requests have been processed. Great job keeping up!</p>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <MagnifyingGlassIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 font-display">No matching requests</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">Try searching with a different reference number, name, or email address.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {paginatedAssignments.map((assignment) => (
            <div key={assignment._id} className="card p-6 hover:shadow-xl transition-all duration-300 group border border-gray-100">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                <div className="flex-1 space-y-5 w-full">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-xl shadow-sm group-hover:scale-105 transition-transform duration-300">
                        {assignment.requestedBy?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg font-display">
                          {assignment.requestedBy?.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                          <IdentificationIcon className="w-4 h-4" />
                          <span className="font-medium">
                            {assignment.requestedBy?.userId || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                          <PhoneIcon className="w-4 h-4" />
                          <span className="font-medium">
                            {assignment.requestedBy?.mobileNumber || 'No Mobile'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100 font-mono">
                        {assignment.referenceNumber || 'N/A'}
                      </span>
                      {/* Status Badge */}
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${assignment.status === 'verification_pending' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        assignment.status === 'awaiting_payment' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          assignment.status === 'payment_pending' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                            'bg-yellow-50 text-yellow-700 border-yellow-100'
                        }`}>
                        {assignment.status === 'verification_pending' ? 'Verifying Payment' :
                          assignment.status === 'awaiting_payment' ? 'Awaiting Payment' :
                            assignment.status === 'payment_pending' ? 'Cash Pending' :
                              'New Request'}
                      </span>
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {new Date(assignment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 space-y-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-gray-400">
                          <EnvelopeIcon className="w-4 h-4" />
                        </div>
                        <span className="truncate">{assignment.requestedBy?.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-gray-400">
                          <BuildingOfficeIcon className="w-4 h-4" />
                        </div>
                        <span>Room <span className="font-semibold text-gray-900">{assignment.room?.number}</span> <span className="text-gray-400 mx-1">•</span> {assignment.room?.type}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 space-y-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-green-500">
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                        <span>Check-in: <span className="font-semibold text-gray-900">{new Date(assignment.startDate).toLocaleDateString()}</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm text-red-500">
                          <CalendarIcon className="w-4 h-4" />
                        </div>
                        <span>Check-out: <span className="font-semibold text-gray-900">{new Date(assignment.endDate).toLocaleDateString()}</span></span>
                      </div>
                    </div>

                    {assignment.idImage && (
                      <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 space-y-3 hover:bg-gray-50 transition-colors md:col-span-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm text-primary-500">
                              <IdentificationIcon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-gray-900">Uploaded ID</span>
                          </div>
                          <button
                            onClick={() => setSelectedIdImage(resolveImageUrl(assignment.idImage))}
                            className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                          >
                            <PhotoIcon className="w-3.5 h-3.5" />
                            View Full Image
                          </button>
                        </div>
                        <div className="h-32 w-full bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer" onClick={() => setSelectedIdImage(resolveImageUrl(assignment.idImage))}>
                          <img
                            src={resolveImageUrl(assignment.idImage)}
                            alt="User ID"
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-40 pt-2 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6">
                  <button
                    onClick={() => handleApproval(assignment._id, true, assignment)}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-sm"
                  >
                    <CheckCircleIcon className="w-5 h-5" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleApproval(assignment._id, false, assignment)}
                    className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-sm"
                  >
                    <XCircleIcon className="w-5 h-5" />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {filteredAssignments.length > 0 && (
        <div className="flex justify-between items-center mt-6 card px-6 py-4">
          <div className="text-sm text-gray-500">
            Showing <span className="font-bold text-gray-900">{startIndex + 1}</span> to <span className="font-bold text-gray-900">{Math.min(endIndex, filteredAssignments.length)}</span> of <span className="font-bold text-gray-900">{filteredAssignments.length}</span> requests
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:text-primary-600 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1 px-4 font-medium">
              <span className="text-gray-900">{currentPage}</span>
              <span className="text-gray-400">/</span>
              <span className="text-gray-500">{totalPages}</span>
            </div>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="p-2 text-gray-500 bg-gray-50 border border-gray-200 rounded-lg hover:bg-white hover:text-primary-600 hover:border-primary-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ID Image Modal */}
      <Modal
        isOpen={!!selectedIdImage}
        onClose={() => setSelectedIdImage(null)}
        title="Identity Verification Document"
        maxWidth="max-w-7xl"
      >
        <div className="p-1 flex justify-center bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={selectedIdImage}
            alt="Full size ID"
            className="max-w-full max-h-[85vh] object-contain"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => setSelectedIdImage(null)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title={confirmationData?.approved ? "Approve Check-In?" : "Reject Check-In?"}
        message={confirmationData?.approved
          ? `Are you sure you want to approve the check-in request for ${confirmationData?.assignmentData?.requestedBy?.name}?`
          : `Are you sure you want to reject the check-in request for ${confirmationData?.assignmentData?.requestedBy?.name}?`
        }
        onConfirm={handleConfirmApproval}
        onCancel={() => setShowConfirmation(false)}
        confirmText={confirmationData?.approved ? "Approve" : "Reject"}
        cancelText="Cancel"
        isLoading={isProcessing}
        variant={confirmationData?.approved ? "success" : "warning"}
      />
    </div>
  );
};

export default PendingCheckins;