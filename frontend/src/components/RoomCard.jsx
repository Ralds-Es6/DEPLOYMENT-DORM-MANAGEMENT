import { useState } from 'react';
import Modal from './Modal';
import { MEDIA_BASE_URL } from '../api/apiConfig';
import {
  UserGroupIcon,
  MapPinIcon,
  TagIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

const RoomCard = ({ room, onRoomClick, onGalleryClick, showStatus = true, showActions = false, actions = null }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return '';
    return imagePath.startsWith('http')
      ? imagePath
      : `${MEDIA_BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      available: 'bg-green-500/90 text-white backdrop-blur-md',
      occupied: 'bg-red-500/90 text-white backdrop-blur-md',
      maintenance: 'bg-yellow-500/90 text-white backdrop-blur-md'
    };

    const icons = {
      available: <CheckCircleIcon className="w-3 h-3 mr-1" />,
      occupied: <XCircleIcon className="w-3 h-3 mr-1" />,
      maintenance: <ExclamationCircleIcon className="w-3 h-3 mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${styles[status] || 'bg-gray-500 text-white'}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleCardClick = (e) => {
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className="group card overflow-hidden cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-500/10 transition-all duration-300 bg-white rounded-2xl border border-gray-100"
        onClick={handleCardClick}
      >
        {/* Room Image */}
        <div className="relative h-56 bg-gray-100 overflow-hidden">
          {room.images && room.images.length > 0 ? (
            <img
              src={resolveImageUrl(room.images[0])}
              alt={`Room ${room.number}`}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}

          {/* Fallback or if image fails */}
          <div className={`w-full h-full flex items-center justify-center bg-gray-50 ${room.images && room.images.length > 0 ? 'hidden' : ''}`}>
            <PhotoIcon className="w-12 h-12 text-gray-300" />
          </div>

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

          {showStatus && (
            <div className="absolute top-3 right-3 z-10">
              {getStatusBadge(room.status)}
            </div>
          )}

          {room.images && Array.isArray(room.images) && room.images.length > 1 && (
            <div
              className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1 hover:bg-black/80 transition-colors cursor-pointer z-10"
              onClick={(e) => {
                e.stopPropagation();
                if (onGalleryClick) {
                  onGalleryClick(room.images, 0);
                }
              }}
            >
              <PhotoIcon className="w-3 h-3" />
              +{room.images.length - 1}
            </div>
          )}

          <div className="absolute bottom-3 left-3 text-white">
            <h3 className="text-2xl font-display font-bold shadow-black/10 drop-shadow-md">Room {room.number}</h3>
          </div>
        </div>

        {/* Room Details */}
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Monthly Rate</span>
              <span className="text-xl font-bold text-primary-600">₱{room.monthlyRate ? room.monthlyRate.toLocaleString() : '0'}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500" title="Capacity">
                <UserGroupIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{room.capacity}</span>
             </div>
          </div>

          {/* Actions */}
          {showActions && actions && (
            <div className="pt-4 mt-2 border-t border-gray-100 flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Room ${room.number} Details`}
      >
        <div className="space-y-6">
           {/* Image Gallery in Modal */}
           <div className="relative h-64 rounded-xl overflow-hidden bg-gray-100">
              {room.images && room.images.length > 0 ? (
                <img
                  src={resolveImageUrl(room.images[0])}
                  alt={`Room ${room.number}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <PhotoIcon className="w-16 h-16 text-gray-300" />
                </div>
              )}
              <div className="absolute top-3 right-3">
                 {getStatusBadge(room.status)}
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                 <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Type</span>
                 <div className="flex items-center gap-2">
                    <TagIcon className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-gray-900">{room.type}</span>
                 </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                 <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Capacity</span>
                 <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-gray-900">{room.capacity} Persons</span>
                 </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                 <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Floor</span>
                 <div className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-gray-900">{room.floor} Floor</span>
                 </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                 <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Rate</span>
                 <div className="flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-primary-500" />
                    <span className="font-medium text-gray-900">₱{room.monthlyRate?.toLocaleString()}</span>
                 </div>
              </div>
           </div>

           {/* Description */}
           {room.description && (
             <div>
               <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <DocumentTextIcon className="w-4 h-4" /> Description
               </h4>
               <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
                 {room.description}
               </p>
             </div>
           )}

           {/* Amenities */}
           {room.amenities && room.amenities.length > 0 && (
             <div>
               <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <ListBulletIcon className="w-4 h-4" /> Amenities
               </h4>
               <div className="grid grid-cols-2 gap-2">
                 {Array.isArray(room.amenities) ? room.amenities.map((amenity, index) => (
                   <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                     <CheckCircleIcon className="w-4 h-4 text-green-500" />
                     {amenity}
                   </div>
                 )) : (
                    typeof room.amenities === 'string' ? room.amenities.split(',').map((amenity, index) => (
                       <div key={index} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                         <CheckCircleIcon className="w-4 h-4 text-green-500" />
                         {amenity.trim()}
                       </div>
                    )) : null
                 )}
               </div>
             </div>
           )}

           {/* Action Button */}
           {onRoomClick && (
             <button
               onClick={() => {
                 setIsModalOpen(false);
                 onRoomClick(room);
               }}
               className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
             >
               {room.status === 'available' ? 'Book This Room' : 'View Details'}
             </button>
           )}
        </div>
      </Modal>
    </>
  );
};

export default RoomCard;

