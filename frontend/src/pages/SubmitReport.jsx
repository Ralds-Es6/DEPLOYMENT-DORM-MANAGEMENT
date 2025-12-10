import { useState, useEffect } from 'react';
import { submitReport, getUserReports } from '../api/reportService';
import { useAuth } from '../context/AuthContext';
import { getAssignments } from '../api/assignmentService';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  PlusIcon,
  XMarkIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  BuildingOfficeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PaperAirplaneIcon,
  LockClosedIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const SubmitReport = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasActiveRoom, setHasActiveRoom] = useState(false);
  const [checkingRoom, setCheckingRoom] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other'
  });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUserReports();
    checkActiveRoomAssignment();
  }, []);

  const checkActiveRoomAssignment = async () => {
    try {
      setCheckingRoom(true);
      const response = await getAssignments();
      const assignments = response.data || response;
      
      // Allow reports if user has APPROVED or ACTIVE check-in
      // Don't allow if only PENDING
      const validAssignment = Array.isArray(assignments) && assignments.some(
        assignment => assignment.status === 'active' || assignment.status === 'approved'
      );
      
      setHasActiveRoom(validAssignment);
    } catch (error) {
      console.error('Error checking room assignment:', error);
      setHasActiveRoom(false);
    } finally {
      setCheckingRoom(false);
    }
  };

  const fetchUserReports = async () => {
    try {
      setLoading(true);
      const response = await getUserReports();
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitReport = (e) => {
    e.preventDefault();

    if (!hasActiveRoom) {
      toast.error('Your check-in must be approved or active to submit a report');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setIsProcessing(true);
      await submitReport(formData);
      toast.success('Report submitted successfully');
      setFormData({ title: '', description: '', category: 'other' });
      setShowForm(false);
      setShowConfirmation(false);
      fetchUserReports();
    } catch (error) {
      toast.error(error.message || 'Failed to submit report');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
      'in-review': 'bg-blue-50 text-blue-700 border-blue-100',
      resolved: 'bg-green-50 text-green-700 border-green-100'
    };
    const icons = {
      pending: <ClockIcon className="w-3 h-3 mr-1" />,
      'in-review': <ExclamationCircleIcon className="w-3 h-3 mr-1" />,
      resolved: <CheckCircleIcon className="w-3 h-3 mr-1" />
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const styles = {
      maintenance: 'bg-orange-50 text-orange-700 border-orange-100',
      complaint: 'bg-red-50 text-red-700 border-red-100',
      other: 'bg-gray-50 text-gray-700 border-gray-100'
    };
    const icons = {
      maintenance: <WrenchScrewdriverIcon className="w-3 h-3 mr-1" />,
      complaint: <ExclamationTriangleIcon className="w-3 h-3 mr-1" />,
      other: <DocumentTextIcon className="w-3 h-3 mr-1" />
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[category] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
        {icons[category]}
        {category === 'maintenance' ? 'Maintenance' : category.charAt(0).toUpperCase() + category.slice(1)}
      </span>
    );
  };

  const totalPages = Math.ceil(reports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = reports.slice(startIndex, endIndex);

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Submit Report</h1>
          <p className="text-gray-500 mt-1">Report issues or send feedback to administration</p>
        </div>
        <button
          onClick={() => {
            if (!hasActiveRoom) {
              toast.error('Your check-in must be approved or active to submit a report');
              return;
            }
            setShowForm(!showForm);
          }}
          disabled={!hasActiveRoom || checkingRoom}
          className={`btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${showForm ? 'bg-red-600 hover:bg-red-700 ring-red-500' : ''} ${!hasActiveRoom ? 'opacity-60' : ''}`}
          title={!hasActiveRoom ? 'Your check-in must be approved or active to submit a report' : ''}
        >
          {showForm ? (
            <>
              <XMarkIcon className="w-5 h-5" />
              Cancel Report
            </>
          ) : !hasActiveRoom ? (
            <>
              <LockClosedIcon className="w-5 h-5" />
              Report Disabled
            </>
          ) : (
            <>
              <PlusIcon className="w-5 h-5" />
              New Report
            </>
          )}
        </button>
      </div>

      {/* No Active Room Alert */}
      {!hasActiveRoom && !checkingRoom && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg flex gap-3">
          <InformationCircleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-800">Room Check-in Required</h3>
            <p className="text-yellow-700 text-sm mt-1">
              You can only submit reports if your room check-in has been approved or is currently active. Users without a room assignment and those with pending check-in requests are not eligible for report submission.
            </p>
          </div>
        </div>
      )}

      {/* Report Form */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showForm ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="card p-6 bg-white border border-gray-100 shadow-lg shadow-primary-500/5 rounded-2xl mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-primary-600" />
            Report Details
          </h2>
          <form onSubmit={handleSubmitReport} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Report Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Brief title of your report"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="other">Other</option>
                  <option value="maintenance">Maintenance Issue</option>
                  <option value="complaint">Complaint</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your report in detail..."
                rows="5"
                className="input-field resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="btn-primary flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Reports List */}
      <div className="card bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-900">Your Reports History</h2>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <DocumentTextIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No reports yet</h3>
            <p className="text-gray-500 mt-1 max-w-sm">
              You haven't submitted any reports. Click the "New Report" button to get started.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paginatedReports.map(report => (
              <div key={report._id} className="p-6 hover:bg-gray-50/50 transition-colors group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">{report.title}</h3>
                      {getCategoryBadge(report.category)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                      {report.currentRoomId && (
                        <span className="flex items-center gap-1 text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded">
                          <BuildingOfficeIcon className="w-3 h-3" />
                          Room {report.currentRoomId.number}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {getStatusBadge(report.status)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-gray-700 text-sm leading-relaxed border border-gray-100">
                  {report.description}
                </div>

                {report.adminRemarks && (
                  <div className="mt-4 flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex-1 bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Admin Response</p>
                      <p className="text-gray-700 text-sm">{report.adminRemarks}</p>
                      {report.resolvedAt && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          Resolved on {new Date(report.resolvedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {reports.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to <span className="font-medium text-gray-900">{Math.min(endIndex, reports.length)}</span> of <span className="font-medium text-gray-900">{reports.length}</span> reports
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
                disabled={currentPage === totalPages}
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
        isOpen={showConfirmation}
        title="Submit Report?"
        message={`Are you sure you want to submit this report: "${formData.title}"?`}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setShowConfirmation(false)}
        confirmText="Submit"
        cancelText="Cancel"
        isLoading={isProcessing}
        variant="success"
      />
    </div>
  );
};

export default SubmitReport;
