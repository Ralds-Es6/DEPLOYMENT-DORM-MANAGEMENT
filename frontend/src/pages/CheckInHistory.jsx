import { useState, useEffect } from 'react';
import { getAssignments } from '../api/assignmentService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const CheckInHistory = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const data = await getAssignments();
      setAssignments(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch check-in history');
      toast.error('Failed to load check-in history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const filteredAssignments = assignments.filter(assignment => {
    const isAuthorized = user?.isAdmin || assignment.requestedBy?._id === user?._id;
    if (!isAuthorized) return false;

    const matchesStatus = filterStatus === 'all' || assignment.status === filterStatus;
    const matchesSearch =
      assignment.room?.number?.toString().includes(searchTerm) ||
      assignment.requestedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.requestedBy?.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

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

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Check-in History</h1>
          <p className="text-gray-500 mt-1">View and manage room assignment records</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64 shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm">
          <p className="font-medium flex items-center gap-2">
            <XCircleIcon className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      <div className="card flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 overflow-x-auto">
          <FunnelIcon className="w-4 h-4 text-gray-400 mr-2" />
          {['all', 'pending', 'approved', 'active', 'completed', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize whitespace-nowrap ${filterStatus === status
                  ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
            >
              {status}
            </button>
          ))}
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No records found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto bg-gray-50/30">
            {/* Desktop View */}
            <table className="min-w-full divide-y divide-gray-100 hidden md:table">
              <thead className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference #</th>
                  {user?.isAdmin && (
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                  )}
                  {user?.isAdmin && (
                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Mobile
                    </th>
                  )}
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Room</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Request Date</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {paginatedAssignments.map((assignment) => (
                  <tr key={assignment._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {assignment.referenceNumber ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-gray-50 text-gray-700 border border-gray-200">
                          {assignment.referenceNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    {user?.isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs shrink-0">
                            {assignment.requestedBy?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">
                              {assignment.requestedBy?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {assignment.requestedBy?.userId || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {user?.isAdmin && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {assignment.requestedBy?.mobileNumber || 'N/A'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">Room {assignment.room?.number || 'N/A'}</span>
                        <span className="text-xs text-gray-500 capitalize">{assignment.room?.type || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900">
                          {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {assignment.createdAt ? new Date(assignment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(assignment.startDate).toLocaleDateString()} - {new Date(assignment.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                        ${assignment.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                          assignment.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                            assignment.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                              assignment.status === 'cancelled' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                'bg-red-50 text-red-700 border-red-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                          ${assignment.status === 'approved' ? 'bg-green-500' :
                            assignment.status === 'active' ? 'bg-blue-500' :
                              assignment.status === 'pending' ? 'bg-yellow-500' :
                                assignment.status === 'cancelled' ? 'bg-orange-500' :
                                  'bg-red-500'}`}></span>
                        {assignment.status === 'completed' ? 'Check-out' : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile View (Stacked Cards) */}
            <div className="md:hidden space-y-3 p-2">
              {paginatedAssignments.map((assignment) => (
                <div key={assignment._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      {assignment.referenceNumber ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-gray-50 text-gray-700 border border-gray-200">
                          {assignment.referenceNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border
                      ${assignment.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                        assignment.status === 'active' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          assignment.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                            assignment.status === 'cancelled' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                              'bg-red-50 text-red-700 border-red-100'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                        ${assignment.status === 'approved' ? 'bg-green-500' :
                          assignment.status === 'active' ? 'bg-blue-500' :
                            assignment.status === 'pending' ? 'bg-yellow-500' :
                              assignment.status === 'cancelled' ? 'bg-orange-500' :
                                'bg-red-500'}`}></span>
                      {assignment.status === 'completed' ? 'Check-out' : assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                    </span>
                  </div>

                  {user?.isAdmin && (
                    <div className="flex items-center pt-3 border-t border-gray-100">
                      <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs shrink-0">
                        {assignment.requestedBy?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-bold text-gray-900">
                          {assignment.requestedBy?.name || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {assignment.requestedBy?.userId || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {assignment.requestedBy?.mobileNumber || 'No Mobile'}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-2 text-sm">
                    <div className="bg-gray-50 p-2.5 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Room</p>
                      <p className="font-bold text-gray-900">
                        {assignment.room?.number || 'N/A'} 
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{assignment.room?.type || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Request Date</p>
                      <p className="font-medium text-gray-900">
                        {assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {assignment.createdAt ? new Date(assignment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <div className="col-span-2 bg-gray-50 p-2.5 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <p className="font-medium text-gray-900">
                        {new Date(assignment.startDate).toLocaleDateString()} - {new Date(assignment.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredAssignments.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to <span className="font-medium text-gray-900">{Math.min(endIndex, filteredAssignments.length)}</span> of <span className="font-medium text-gray-900">{filteredAssignments.length}</span> records
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
    </div>
  );
};

export default CheckInHistory;