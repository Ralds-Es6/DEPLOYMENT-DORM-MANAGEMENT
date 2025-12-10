import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAssignments } from '../api/assignmentService';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const UserProfile = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const data = await getAssignments();
      const userAssignments = data.filter(a => a.userId === user._id);
      setAssignments(userAssignments);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch assignments');
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

  return (
    <div className="space-y-6 animate-fade-in">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm">
          <p className="font-medium flex items-center gap-2">
            <XCircleIcon className="w-5 h-5" />
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information Card */}
        <div className="lg:col-span-1">
          <div className="card h-full overflow-hidden">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
                <div className="absolute bottom-[-50%] right-[-50%] w-full h-full bg-secondary-500 rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
              </div>

              <div className="relative z-10">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full mx-auto flex items-center justify-center mb-4 border-2 border-white/30 shadow-xl">
                  <span className="text-4xl font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h2 className="text-2xl font-display font-bold">{user.name}</h2>
                <p className="text-primary-100 text-sm mt-1">User Account</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <UserCircleIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Full Name</p>
                  <p className="text-gray-900 font-semibold">{user.name}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <EnvelopeIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Email Address</p>
                  <p className="text-gray-900 font-semibold">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <PhoneIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Mobile Number</p>
                  <p className="text-gray-900 font-semibold">{user.mobileNumber || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Member Since</p>
                  <p className="text-gray-900 font-semibold">
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Check-in History */}
        <div className="lg:col-span-2">
          <div className="card h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="text-lg font-display font-bold text-gray-900 flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5 text-primary-500" />
                Check-in History
              </h3>
              <span className="bg-primary-100 text-primary-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {assignments.length} Records
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {assignments.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                  <CalendarIcon className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">No check-in history found</p>
                  <p className="text-sm">Your room assignments will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment._id}
                      className="group bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:border-primary-100 relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-bold text-lg shrink-0">
                            {assignment.room?.number}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">Room {assignment.room?.number}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>
                                {new Date(assignment.startDate).toLocaleDateString()} - {new Date(assignment.endDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border
                            ${assignment.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' :
                              assignment.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                'bg-gray-50 text-gray-700 border-gray-100'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                              ${assignment.status === 'active' ? 'bg-green-500' :
                                assignment.status === 'pending' ? 'bg-yellow-500' :
                                  'bg-gray-500'}`}></span>
                            {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;