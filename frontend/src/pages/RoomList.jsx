import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../api/roomService';
import { getAssignments } from '../api/assignmentService';
import Modal from '../components/Modal';
import RoomForm from '../components/RoomForm';
import RoomCard from '../components/RoomCard';
import ConfirmationModal from '../components/ConfirmationModal';
import toast from 'react-hot-toast';
import { MEDIA_BASE_URL } from '../api/apiConfig';
import {
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  TrashIcon,
  PencilSquareIcon,
  PhotoIcon,
  BuildingOfficeIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [selectedRoomForCheckIn, setSelectedRoomForCheckIn] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (roomData) => {
    try {
      const newRoom = await createRoom(roomData);
      setRooms([...rooms, newRoom]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    }
  };

  const handleUpdateRoom = async (id, roomData) => {
    try {
      const updatedRoom = await updateRoom(id, roomData);
      setRooms(rooms.map(room => room._id === id ? updatedRoom : room));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update room');
    }
  };

  const handleDeleteRoom = (id) => {
    const room = rooms.find(r => r._id === id);
    setRoomToDelete(room);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteRoom = async () => {
    try {
      setIsDeleting(true);
      await deleteRoom(roomToDelete._id);
      setRooms(rooms.filter(room => room._id !== roomToDelete._id));
      toast.success('Room deleted successfully');
      setShowDeleteConfirm(false);
      setError(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete room');
      setError(err.message || 'Failed to delete room');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenModal = (room = null) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedRoom(null);
    setIsModalOpen(false);
  };

  const handleOpenCheckInModal = async (room) => {
    setSelectedRoomForCheckIn(room);
    setLoadingCheckIns(true);
    try {
      const assignments = await getAssignments();
      const roomActiveUsers = assignments.filter(
        a => a.room?._id === room._id && 
             (a.status === 'active' || a.status === 'approved') &&
             a.requestedBy
      );
      setActiveUsers(roomActiveUsers);
    } catch (err) {
      console.error('Error fetching check-ins:', err);
      setActiveUsers([]);
    } finally {
      setLoadingCheckIns(false);
    }
    setIsCheckInModalOpen(true);
  };

  const handleCloseCheckInModal = () => {
    setIsCheckInModalOpen(false);
    setSelectedRoomForCheckIn(null);
    setActiveUsers([]);
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

  const handleSubmitRoom = async (roomData) => {
    try {
      if (selectedRoom) {
        // For updates, roomData is FormData
        const updatedRoom = await updateRoom(selectedRoom._id, roomData);
        setRooms(prevRooms => prevRooms.map(room => 
          room._id === selectedRoom._id ? updatedRoom : room
        ));
      } else {
        // For new rooms, roomData is FormData - pass it directly to createRoom
        const newRoom = await createRoom(roomData);
        
        // Add the new room to the state
        setRooms(prevRooms => [...prevRooms, newRoom]);
      }
      
      // Only close modal and clear error if successful
      handleCloseModal();
      setError(null);
      return true;
    } catch (error) {
      // Error toast is already shown in RoomForm
      console.error('Error saving room:', error);
      setError(error.message || 'Failed to save room');
      return false;
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesFilter = filter === 'all' || room.status === filter;
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400 text-red-700 rounded-lg">
          <p className="font-medium">Error: {error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-500 mt-1">Manage and monitor all dormitory rooms</p>
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

          <button 
            onClick={() => handleOpenModal()}
            className="btn-primary flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
          >
            <PlusIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Add Room</span>
          </button>
        </div>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden bg-white border border-gray-100 shadow-sm rounded-2xl">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 overflow-x-auto">
          <FunnelIcon className="w-4 h-4 text-gray-400 mr-2" />
          {['all', 'available', 'occupied'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 capitalize whitespace-nowrap ${filter === type
                ? 'bg-white text-primary-600 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
                }`}
            >
              {type === 'all' ? 'All Rooms' : type}
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
        ) : (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRooms.map((room) => (
                <RoomCard
                  key={room._id}
                  room={room}
                  onGalleryClick={handleGalleryClick}
                  showActions={true}
                  actions={
                    <>
                      <button
                        onClick={() => handleOpenCheckInModal(room)}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="View Check-ins"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenModal(room)}
                        className="p-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room._id)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={selectedRoom ? 'Edit Room' : 'Add New Room'}
      >
        <RoomForm
          room={selectedRoom}
          onSubmit={handleSubmitRoom}
          onCancel={handleCloseModal}
        />
      </Modal>

      {isCheckInModalOpen && selectedRoomForCheckIn && (
        <Modal
          isOpen={isCheckInModalOpen}
          onClose={handleCloseCheckInModal}
          title={`Room ${selectedRoomForCheckIn.number} - Active Check-ins`}
        >
          {loadingCheckIns ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : activeUsers.length === 0 ? (
            <div className="text-center py-12">
              <EyeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium text-lg">No Users Currently Check-in</p>
              <p className="text-gray-400 text-sm mt-2">This room is currently unoccupied</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="font-medium text-gray-900">{activeUsers.length} active check-in{activeUsers.length !== 1 ? 's' : ''}</p>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activeUsers.map((assignment) => (
                  <div key={assignment._id} className="p-4 border border-gray-200 rounded-xl bg-gradient-to-r from-blue-50 to-transparent hover:border-blue-300 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {assignment.requestedBy?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{assignment.requestedBy?.name}</p>
                        <p className="text-xs text-gray-500">ID: {assignment.requestedBy?.userId}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                        Active
                      </span>
                    </div>

                    {/* Reference Number - Prominent Display */}
                    <div className="bg-white border border-primary-200 rounded-lg p-3 mb-3">
                      <p className="text-xs text-gray-500 uppercase font-medium mb-1">Booking Reference</p>
                      <p className="text-sm font-mono font-bold text-primary-600">{assignment.referenceNumber || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Check-in Date</p>
                        <p className="text-gray-900 font-medium">{new Date(assignment.checkInTime || assignment.approvalTime).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-medium">Status</p>
                        <p className="text-gray-900 font-medium capitalize">{assignment.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}

      {isGalleryOpen && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl">
            {/* Close Button */}
            <button
              onClick={handleCloseGallery}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Main Image */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
              <img
                src={resolveImageUrl(galleryImages[currentImageIndex])}
                alt={`Gallery image ${currentImageIndex + 1}`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-full h-full bg-gray-900" style={{display: 'none'}}>
                <PhotoIcon className="w-16 h-16 text-gray-600" />
              </div>
            </div>

            {/* Image Counter */}
            <div className="text-center mt-4 text-white">
              <p className="text-sm font-medium">
                {currentImageIndex + 1} of {galleryImages.length}
              </p>
            </div>

            {/* Navigation Buttons */}
            {galleryImages.length > 1 && (
              <div className="flex justify-between items-center mt-6">
                <button
                  onClick={handlePrevImage}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronLeftIcon className="w-6 h-6" />
                </button>

                {/* Thumbnails */}
                <div className="flex gap-2 overflow-x-auto max-w-md justify-center">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                        idx === currentImageIndex
                          ? 'border-white shadow-lg shadow-white/50'
                          : 'border-white/30 hover:border-white/50'
                      }`}
                    >
                      <img
                        src={resolveImageUrl(img)}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNextImage}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <ChevronRightIcon className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Room Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Room?"
        message={`Are you sure you want to delete Room ${roomToDelete?.number}? This action cannot be undone.`}
        onConfirm={handleConfirmDeleteRoom}
        onCancel={() => setShowDeleteConfirm(false)}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
};

export default RoomList;
