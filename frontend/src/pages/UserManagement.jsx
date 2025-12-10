import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getAllUsers, blockUser, unblockUser, deleteUser } from '../api/userService';
import { getAssignments } from '../api/assignmentService';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  MagnifyingGlassIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  NoSymbolIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UsersIcon,
  CheckCircleIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    try {
      const [usersData, assignmentsData] = await Promise.all([
        getAllUsers(),
        getAssignments()
      ]);
      setUsers(usersData);
      setAssignments(assignmentsData);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch users');
      toast.error(err.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get user's pending or active assignment reference number
  const getUserReferenceNumber = (userId) => {
    const userAssignment = assignments.find(
      a => a.requestedBy?._id === userId && (a.status === 'pending' || a.status === 'approved' || a.status === 'active')
    );
    return userAssignment?.referenceNumber || '-';
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBlockUser = async (userId, userName) => {
    try {
      await blockUser(userId);
      setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: true } : u));
      toast.success(`${userName} has been blocked successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (userId, userName) => {
    try {
      await unblockUser(userId);
      setUsers(users.map(u => u._id === userId ? { ...u, isBlocked: false } : u));
      toast.success(`${userName} has been unblocked successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to unblock user');
    }
  };

  const handleDeleteUser = (userId, userName) => {
    setConfirmationData({ userId, userName });
    setShowConfirmation(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsProcessing(true);
      const { userId, userName } = confirmationData;
      await deleteUser(userId);
      setUsers(users.filter(u => u._id !== userId));
      toast.success(`${userName} has been deleted successfully`);
      setShowConfirmation(false);
    } catch (err) {
      toast.error(err.message || 'Failed to delete user');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block">
          {error}
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    return (
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.userId && u.userId.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

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
    <>
      <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system users, roles, and access permissions</p>
        </div>

        <div className="relative group">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full md:w-64 shadow-sm transition-all"
          />
        </div>
      </div>

      <div className="card overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="overflow-x-auto bg-gray-50/30">
          {/* Desktop View */}
          <table className="min-w-full divide-y divide-gray-100 hidden md:table">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User Info</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {paginatedUsers.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 ring-4 ring-white">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{u.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <EnvelopeIcon className="w-3 h-3" />
                          {u.email}
                        </div>
                        {u.userId && (
                          <div className="text-xs text-primary-600 mt-0.5 font-medium">ID: {u.userId}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <PhoneIcon className="w-3 h-3" />
                          {u.mobileNumber || 'No Mobile'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${u.isSuperAdmin
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : u.isAdmin
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                      <ShieldCheckIcon className="w-3 h-3 mr-1" />
                      {u.isSuperAdmin ? 'Super Admin' : u.isAdmin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${u.isBlocked
                        ? 'bg-red-50 text-red-700 border-red-100'
                        : 'bg-green-50 text-green-700 border-green-100'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.isBlocked ? 'bg-red-500' : 'bg-green-500'
                        }`}></span>
                      {u.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {!u.isAdmin && (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {u.isBlocked ? (
                          <button
                            onClick={() => handleUnblockUser(u._id, u.name)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Unblock User"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBlockUser(u._id, u.name)}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                            title="Block User"
                          >
                            <NoSymbolIcon className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile View (Stacked Cards) */}
          <div className="md:hidden space-y-3 p-2">
            {paginatedUsers.map((u) => (
              <div key={u._id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 ring-2 ring-white shrink-0">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-gray-900 truncate">{u.name}</div>
                      <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                        <EnvelopeIcon className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{u.email}</span>
                      </div>
                      {u.userId && (
                        <div className="text-xs text-primary-600 mt-0.5 font-medium truncate">ID: {u.userId}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                        <PhoneIcon className="w-3 h-3 flex-shrink-0" />
                        {u.mobileNumber || 'No Mobile'}
                      </div>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 ${u.isBlocked
                      ? 'bg-red-50 text-red-700 border-red-100'
                      : 'bg-green-50 text-green-700 border-green-100'
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.isBlocked ? 'bg-red-500' : 'bg-green-500'
                      }`}></span>
                    {u.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex flex-col gap-1">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border w-fit ${u.isSuperAdmin
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : u.isAdmin
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                      <ShieldCheckIcon className="w-3 h-3 mr-1" />
                      {u.isSuperAdmin ? 'Super Admin' : u.isAdmin ? 'Admin' : 'User'}
                    </span>
                    <span className="text-xs text-gray-400">
                      Joined: {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {!u.isAdmin && (
                    <div className="flex items-center gap-2">
                      {u.isBlocked ? (
                        <button
                          onClick={() => handleUnblockUser(u._id, u.name)}
                          className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                          title="Unblock User"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlockUser(u._id, u.name)}
                          className="p-2 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                          title="Block User"
                        >
                          <NoSymbolIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete User"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination Controls */}
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to <span className="font-medium text-gray-900">{Math.min(endIndex, filteredUsers.length)}</span> of <span className="font-medium text-gray-900">{filteredUsers.length}</span> users
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

    {/* Confirmation Modal */}
    <ConfirmationModal
      isOpen={showConfirmation}
      title="Delete User Account?"
      message={`Are you sure you want to delete ${confirmationData?.userName}? This action cannot be undone.`}
      onConfirm={handleConfirmDelete}
      onCancel={() => setShowConfirmation(false)}
      confirmText="Delete"
      cancelText="Cancel"
      isLoading={isProcessing}
      variant="danger"
    />
    </>
  );
};

export default UserManagement;