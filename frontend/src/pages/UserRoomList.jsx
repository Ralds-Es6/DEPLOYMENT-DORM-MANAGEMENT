import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getRooms } from '../api/roomService';
import { createAssignment, getAssignments } from '../api/assignmentService';
import CheckInModal from '../components/CheckInModal';
import TermsAndConditionsModal from '../components/TermsAndConditionsModal';
import RoomCard from '../components/RoomCard';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';
import { MEDIA_BASE_URL } from '../api/apiConfig';
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  TableCellsIcon,
  FunnelIcon,
  PhotoIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ClockIcon,
  InformationCircleIcon,
  KeyIcon,
  BuildingOfficeIcon,
  XMarkIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';

const UserRoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('available');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [pendingRequest, setPendingRequest] = useState(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const itemsPerPage = 10;

  useEffect(() => {
    fetchRooms();
    checkPendingRequests();
  }, []);

  const checkPendingRequests = async () => {
    try {
      const assignments = await getAssignments();
      const pending = assignments.find(
        a => a.requestedBy?._id === user._id && ['pending', 'approved'].includes(a.status)
      );
      setPendingRequest(pending);
    } catch (err) {
      console.error('Failed to check pending requests:', err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkPendingRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch rooms');
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (roomId) => {
    try {
      if (pendingRequest) {
        toast.error('You already have a pending or approved check-in request');
        return;
      }

      const room = rooms.find(r => r._id === roomId);
      setSelectedRoom(room);
      setIsTermsModalOpen(true);
    } catch (err) {
      toast.error(err.message || 'Failed to open check-in dialog');
    }
  };

  const [idImage, setIdImage] = useState(null);

  const handleTermsAgree = (image) => {
    setIdImage(image);
    setIsTermsModalOpen(false);
    setIsCheckInModalOpen(true);
  };

  const handleCheckInConfirm = async (checkInData) => {
    try {
      const formData = new FormData();
      formData.append('roomId', selectedRoom._id);
      formData.append('startDate', checkInData.startDate);
      formData.append('endDate', checkInData.endDate);
      formData.append('totalPrice', checkInData.totalPrice);
      if (idImage) {
        formData.append('idImage', idImage);
      }

      const response = await createAssignment(formData);

      setPendingRequest(response);
      setBookingSuccess({
        ...response,
        duration: checkInData.duration,
        totalPrice: checkInData.totalPrice
      });
      setIsCheckInModalOpen(false);
      setIdImage(null);
      fetchRooms();
    } catch (err) {
      toast.error(err.message || 'Failed to submit check-in request');
    }
  };

  const handleGalleryClick = (images, startIndex = 0) => {
    setGalleryImages(images);
    setCurrentImageIndex(startIndex);
    setIsGalleryOpen(true);
  };

  const handleCloseGallery = () => {
    setIsGalleryOpen(false);
    setGalleryImages([]);
    setCurrentImageIndex(0);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return '';
    return imagePath.startsWith('http')
      ? imagePath
      : `${MEDIA_BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toString().includes(searchTerm) ||
      room.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.floor.toString().includes(searchTerm);

    const isAvailable = room.occupied < room.capacity && room.status === 'available';

    if (filter === 'available') {
      return matchesSearch && isAvailable;
    }
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

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
  }, [filter, searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col animate-fade-in">
      <CheckInModal
        room={selectedRoom}
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onConfirm={handleCheckInConfirm}
      />

      <TermsAndConditionsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAgree={handleTermsAgree}
      />

      {/* Booking Success Modal */}
      <Modal
        isOpen={!!bookingSuccess}
        onClose={() => setBookingSuccess(null)}
        title="Booking Request Submitted"
      >
        <div className="text-center space-y-6">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
            <ClipboardDocumentCheckIcon className="h-10 w-10 text-green-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Request Successfully Submitted!</h3>
            <p className="text-sm text-gray-500 mt-2">
              Your booking request for Room <span className="font-bold text-gray-900">{bookingSuccess?.room?.number}</span> has been received.
            </p>
          </div>

          <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
            <p className="text-xs text-primary-600 uppercase font-bold tracking-wider mb-1">Reference Number</p>
            <p className="text-2xl font-mono font-bold text-primary-700 tracking-wider select-all">
              {bookingSuccess?.referenceNumber}
            </p>
            <p className="text-xs text-primary-500 mt-2">
              Please save this number
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Duration:</span>
              <span className="font-medium text-gray-900">{bookingSuccess?.duration} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Amount:</span>
              <span className="font-bold text-primary-600">₱{bookingSuccess?.totalPrice?.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-left flex gap-3">
            <InformationCircleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <p className="text-sm text-yellow-800">
              Please present the <strong>Reference Number</strong> at the administration office to complete your payment and approve your check-in request.
            </p>
          </div>

          <button
            onClick={() => setBookingSuccess(null)}
            className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-3 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm transition-colors"
          >
            I Understand
          </button>
        </div>
      </Modal>

      {pendingRequest && (
        <div className="bg-gradient-to-r from-primary-50 to-white border border-primary-100 rounded-2xl p-6 animate-fade-in shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-full mix-blend-multiply filter blur-2xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="p-3 bg-white rounded-xl shadow-sm text-primary-600 ring-1 ring-primary-100">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-display font-bold text-gray-900">
                {pendingRequest.status === 'pending' ? 'Pending Check-in Request' : 'Check-in Request Approved'}
              </h3>
              <p className="mt-1 text-gray-600">
                You have a <span className="font-medium text-primary-700">{pendingRequest.status}</span> check-in request for Room <span className="font-bold text-gray-900">{pendingRequest.room?.number}</span>.
              </p>
              <button
                onClick={() => navigate('/checkin-history')}
                className="mt-3 text-sm font-medium text-primary-600 hover:text-primary-800 flex items-center gap-1 transition-colors group"
              >
                View Check-in History <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">Available Rooms</h1>
          <p className="text-gray-500 mt-1">Browse and request check-in to available rooms</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative group">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64 shadow-sm transition-all"
            />
          </div>

          <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                ? 'bg-primary-50 text-primary-600 shadow-sm ring-1 ring-black/5'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              title="Grid View"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'table'
                ? 'bg-primary-50 text-primary-600 shadow-sm ring-1 ring-black/5'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              title="Table View"
            >
              <TableCellsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 overflow-x-auto">
          <FunnelIcon className="w-4 h-4 text-gray-400 mr-2" />
          {['all', 'available'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize whitespace-nowrap ${filter === type
                ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
            >
              {type === 'all' ? 'All Rooms' : 'Available Only'}
            </button>
          ))}
        </div>

        {filteredRooms.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-lg font-medium text-gray-900">No rooms found</p>
            <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedRooms.map((room) => (
                <RoomCard
                  key={room._id}
                  room={room}
                  onGalleryClick={handleGalleryClick}
                  onRoomClick={(r) => {
                    if (r.status === 'available' && r.occupied < r.capacity) {
                      handleCheckIn(r._id);
                    } else {
                      toast.error('This room is not available for check-in');
                    }
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50 sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Room Info</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {paginatedRooms.map((room) => (
                  <tr key={room._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 group-hover:scale-105 transition-transform duration-300">
                          {room.images && room.images.length > 0 ? (
                            <img
                              src={resolveImageUrl(room.images[0])}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`h-full w-full flex items-center justify-center ${room.images && room.images.length > 0 ? 'hidden' : ''}`}>
                            <PhotoIcon className="w-6 h-6 text-gray-300" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">Room {room.number}</div>
                          <div className="text-xs text-gray-500">Floor {room.floor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 capitalize border border-gray-200">
                        {room.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${room.occupied >= room.capacity ? 'bg-red-500' : 'bg-primary-500'
                              }`}
                            style={{ width: `${(room.occupied / room.capacity) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">{room.occupied}/{room.capacity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${room.status === 'available' ? 'bg-green-50 text-green-700 border-green-100' :
                        room.status === 'occupied' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-yellow-50 text-yellow-700 border-yellow-100'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${room.status === 'available' ? 'bg-green-500' :
                          room.status === 'occupied' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}></span>
                        {room.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {room.status === 'available' && room.occupied < room.capacity ? (
                        <button
                          onClick={() => handleCheckIn(room._id)}
                          disabled={!!pendingRequest}
                          className="text-primary-600 hover:text-primary-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:underline"
                        >
                          Check In
                        </button>
                      ) : (
                        <span className="text-gray-400 italic">Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {filteredRooms.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{startIndex + 1}</span> to <span className="font-medium text-gray-900">{Math.min(endIndex, filteredRooms.length)}</span> of <span className="font-medium text-gray-900">{filteredRooms.length}</span> rooms
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

      {/* Photo Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Close Button */}
          <button
            onClick={handleCloseGallery}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white text-sm font-medium z-10">
            {currentImageIndex + 1} / {galleryImages.length}
          </div>

          {/* Previous Button */}
          {galleryImages.length > 1 && (
            <button
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            >
              <ChevronLeftIcon className="w-8 h-8" />
            </button>
          )}

          {/* Image Container */}
          <div className="w-full h-full flex items-center justify-center px-20 py-16">
            <img
              src={resolveImageUrl(galleryImages[currentImageIndex])}
              alt={`Room photo ${currentImageIndex + 1}`}
              className="min-w-[50vw] min-h-[50vh] max-w-[90vw] max-h-[85vh] object-contain rounded-xl shadow-2xl animate-fade-in"
              key={currentImageIndex}
            />
          </div>

          {/* Next Button */}
          {galleryImages.length > 1 && (
            <button
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            >
              <ChevronRightIcon className="w-8 h-8" />
            </button>
          )}

          {/* Thumbnail Strip */}
          {galleryImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-white/10 backdrop-blur-md rounded-full max-w-[90vw] overflow-x-auto">
              {galleryImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${index === currentImageIndex
                    ? 'ring-2 ring-white scale-110'
                    : 'opacity-60 hover:opacity-100'
                    }`}
                >
                  <img
                    src={resolveImageUrl(image)}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserRoomList;
