import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAvailablePublicRooms } from '../api/roomService';
import RoomCard from '../components/RoomCard';
import RoomTable from '../components/RoomTable';
import {
  MagnifyingGlassIcon,
  Squares2X2Icon,
  ListBulletIcon,
  BuildingOfficeIcon,
  HomeModernIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const BrowseRooms = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();
  
  const ROOMS_PER_PAGE = 12;

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const data = await getAvailablePublicRooms();
      setRooms(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch rooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (room) => {
    navigate('/register');
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
    const MEDIA_BASE_URL = import.meta.env.VITE_API_ORIGIN || 'http://localhost:5000';
    return imagePath.startsWith('http')
      ? imagePath
      : `${MEDIA_BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
  };

  // All rooms returned from backend are already available
  const availableRooms = rooms;

  // Filter by search term only
  const filteredRooms = availableRooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRooms.length / ROOMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROOMS_PER_PAGE;
  const endIndex = startIndex + ROOMS_PER_PAGE;
  const paginatedRooms = filteredRooms.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-screen bg-gray-50/50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform duration-200">
                <BuildingOfficeIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display font-bold text-gray-900 text-lg leading-tight">KARMIN'S</h1>
                <p className="text-xs text-primary-600 font-medium tracking-wide">DORMITORY</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              {!user ? (
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                >
                  Register
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-8 animate-fade-in">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg shadow-sm">
              <p className="font-medium flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Error: {error}
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-display font-bold text-gray-900 flex items-center gap-3">
                <HomeModernIcon className="w-10 h-10 text-primary-600" />
                Available Rooms
              </h1>
              <p className="mt-2 text-gray-500 flex items-center gap-2">
                <span className="bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded-full text-sm font-medium">
                  {availableRooms.length}
                </span>
                {availableRooms.length === 1 ? 'room' : 'rooms'} available for check-in
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search rooms..."
                  className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all shadow-sm group-hover:shadow-md"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-3 text-gray-400 group-hover:text-primary-500 transition-colors">
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </div>
              </div>

              <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'grid'
                    ? 'bg-primary-50 text-primary-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  title="Grid View"
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-all duration-200 ${viewMode === 'table'
                    ? 'bg-primary-50 text-primary-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  title="Table View"
                >
                  <ListBulletIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="min-h-[400px]">
            {filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <BuildingOfficeIcon className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No rooms found</h3>
                <p className="text-gray-500 max-w-sm">
                  We couldn't find any rooms matching your search criteria. Try adjusting your filters.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedRooms.map((room) => (
                    <RoomCard
                      key={room._id}
                      room={room}
                      onRoomClick={() => handleRoomClick(room)}
                      onGalleryClick={handleGalleryClick}
                      showStatus={false}
                      showActions={false}
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <span className="px-4 py-2 text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Last
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <RoomTable
                    rooms={paginatedRooms}
                    onRoomClick={handleRoomClick}
                    showStatus={false}
                    showActions={false}
                  />
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 pb-4">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <span className="px-4 py-2 text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Last
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dormitory Info Section - Bottom */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">About KARMIN'S Dormitory</h2>
              <p className="text-gray-600">Discover what makes our dormitory the perfect place to call home</p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Safe & Secure - Green Theme */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm border border-green-200 hover:shadow-lg hover:border-green-300 transition-all duration-200 group">
                <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-300 transition-colors">
                  <StarIcon className="w-6 h-6 text-green-700" />
                </div>
                <h3 className="font-semibold text-green-900 mb-2">Safe & Secure</h3>
                <p className="text-green-700 text-sm">24/7 security with CCTV monitoring and trained security personnel to ensure your safety.</p>
              </div>

              {/* Vibrant Community - Blue Theme */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-200 group">
                <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-300 transition-colors">
                  <UserGroupIcon className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="font-semibold text-blue-900 mb-2">Vibrant Community</h3>
                <p className="text-blue-700 text-sm">Connect with like-minded residents, attend events, and build lasting friendships.</p>
              </div>

              {/* Modern Amenities - Purple Theme */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-sm border border-purple-200 hover:shadow-lg hover:border-purple-300 transition-all duration-200 group">
                <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-300 transition-colors">
                  <HomeModernIcon className="w-6 h-6 text-purple-700" />
                </div>
                <h3 className="font-semibold text-purple-900 mb-2">Modern Amenities</h3>
                <p className="text-purple-700 text-sm">High-speed WiFi, laundry facilities, common areas, and more for your convenience.</p>
              </div>
            </div>

            {/* Contact Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Info Card */}
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl p-8 border border-primary-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPinIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Address</p>
                      <p className="text-sm text-gray-600 mt-0.5">Vanex Talisay, Purok 5-B Recodo Zamboanga City</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <PhoneIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600 mt-0.5">+63 (9976) 930-430</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <EnvelopeIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600 mt-0.5">jusm14679@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <ClockIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Availability</p>
                      <p className="text-sm text-gray-600 mt-0.5">24/7 Available</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-xl p-8 border border-secondary-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Status</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Rooms Available</span>
                      <span className="bg-secondary-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {availableRooms.length}
                      </span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((availableRooms.length / 50) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-secondary-300">
                    <p className="text-sm text-gray-600">
                      Join our community and experience comfortable, affordable living with top-notch facilities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white text-gray-600 py-8 mt-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2025 KARMIN'S Dormitory Management System. All rights reserved. | ™ KARMIN'S is a registered trademark.
          </p>
        </div>
      </footer>

      {/* Modals */}
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

export default BrowseRooms;
