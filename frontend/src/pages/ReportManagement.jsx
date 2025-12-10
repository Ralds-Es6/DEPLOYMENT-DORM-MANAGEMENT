import { useState, useEffect } from 'react';
import { getAllReports, updateReport, deleteReport } from '../api/reportService';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  ClipboardDocumentListIcon,
  FunnelIcon,
  EyeIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  UserIcon,
  BuildingOfficeIcon,
  TagIcon
} from '@heroicons/react/24/outline';

const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateData, setUpdateData] = useState({
    status: '',
    adminRemarks: ''
  });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    try {
      setLoading(true);
      const response = await getAllReports();
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (report) => {
    setSelectedReport(report);
    setUpdateData({
      status: report.status,
      adminRemarks: report.adminRemarks || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReport(null);
    setUpdateData({ status: '', adminRemarks: '' });
  };

  const handleUpdateReport = () => {
    if (!updateData.status) {
      toast.error('Please select a status');
      return;
    }

    setConfirmationData({ 
      action: 'update',
      reportId: selectedReport._id
    });
    setShowConfirmation(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      setIsProcessing(true);
      await updateReport(selectedReport._id, updateData);
      toast.success('Report updated successfully');
      fetchAllReports();
      handleCloseModal();
      setShowConfirmation(false);
    } catch (error) {
      toast.error(error.message || 'Failed to update report');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteReport = (id) => {
    setConfirmationData({
      action: 'delete',
      reportId: id
    });
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsProcessing(true);
      await deleteReport(confirmationData.reportId);
      toast.success('Report deleted successfully');
      fetchAllReports();
      setShowConfirmation(false);
    } catch (error) {
      toast.error(error.message || 'Failed to delete report');
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
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${styles[category] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
        {category}
      </span>
    );
  };

  const filteredReports = reports.filter(report => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (filterCategory !== 'all' && report.category !== filterCategory) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterCategory]);

  return (
    <>
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Report Management</h1>
          <p className="text-gray-500 mt-1">Track and resolve issues reported by students</p>
        </div>
      </div>

      <div className="card p-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
              Filter by Status
            </label>
            <div className="relative">
              <FunnelIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-review">In Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">
              Filter by Category
            </label>
            <div className="relative">
              <TagIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              >
                <option value="all">All Categories</option>
                <option value="maintenance">Maintenance Issue</option>
                <option value="complaint">Complaint</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ClipboardDocumentListIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-900">No reports found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar bg-gray-50/30">
            {/* Desktop View */}
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Report Details</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted By</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {paginatedReports.map(report => (
                  <tr key={report._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{report.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{report.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mr-3">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{report.userId?.userId || 'Unknown'}</div>
                          {report.currentRoomId && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <BuildingOfficeIcon className="w-3 h-3" />
                              Room {report.currentRoomId.number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCategoryBadge(report.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(report)}
                          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Review Report"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteReport(report._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Report"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile View (Stacked Cards) */}
            <div className="md:hidden space-y-3 p-2">
              {paginatedReports.map(report => (
                <div key={report._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-gray-900 truncate">{report.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{report.description}</div>
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(report.status)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(report.category)}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <ClockIcon className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center min-w-0">
                      <div className="h-8 w-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mr-3 flex-shrink-0">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{report.userId?.userId || 'Unknown'}</div>
                        {report.currentRoomId && (
                          <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                            <BuildingOfficeIcon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Room {report.currentRoomId.number}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleOpenModal(report)}
                        className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                        title="Review Report"
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteReport(report._id)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete Report"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredReports.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to <span className="font-medium text-gray-900">{Math.min(endIndex, filteredReports.length)}</span> of <span className="font-medium text-gray-900">{filteredReports.length}</span> reports
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

      {/* Modal */}
      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">Review Report</h2>
                <p className="text-sm text-gray-500">Update status and add remarks</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Report Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedReport.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <UserIcon className="w-4 h-4" />
                      <span>{selectedReport.userId?.userId || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(selectedReport.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {getCategoryBadge(selectedReport.category)}
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-700 text-sm leading-relaxed">
                  {selectedReport.description}
                </div>

                {selectedReport.currentRoomId && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-primary-700 bg-primary-50 px-3 py-2 rounded-lg">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    Currently occupying: Room #{selectedReport.currentRoomId.number} ({selectedReport.currentRoomId.type})
                  </div>
                )}
              </div>

              {/* Update Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ChatBubbleLeftRightIcon className="w-5 h-5 text-primary-600" />
                  Admin Response
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Status
                    </label>
                    <div className="py-2">
                      {getStatusBadge(selectedReport.status)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Update Status
                    </label>
                    <select
                      value={updateData.status}
                      onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-review">In Review</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Remarks
                  </label>
                  <textarea
                    value={updateData.adminRemarks}
                    onChange={(e) => setUpdateData(prev => ({ ...prev, adminRemarks: e.target.value }))}
                    placeholder="Add remarks or comments about this report..."
                    rows="4"
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateReport}
                className="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-md shadow-primary-500/20"
              >
                Update Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title={confirmationData?.action === 'update' ? "Update Report?" : "Delete Report?"}
        message={confirmationData?.action === 'update'
          ? "Are you sure you want to update this report with the selected status and remarks?"
          : "Are you sure you want to delete this report? This action cannot be undone."
        }
        onConfirm={confirmationData?.action === 'update' ? handleConfirmUpdate : handleConfirmDelete}
        onCancel={() => setShowConfirmation(false)}
        confirmText={confirmationData?.action === 'update' ? "Update" : "Delete"}
        cancelText="Cancel"
        isLoading={isProcessing}
        variant={confirmationData?.action === 'update' ? "success" : "danger"}
      />
    </div>
    </>
  );
};

export default ReportManagement;
