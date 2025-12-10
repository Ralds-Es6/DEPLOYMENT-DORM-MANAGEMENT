import { MEDIA_BASE_URL } from '../api/apiConfig';
import {
  UserGroupIcon,
  MapPinIcon,
  TagIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

const RoomTable = ({ rooms, onRoomClick, showStatus = true, showActions = false, actions = null }) => {
  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return '';
    return imagePath.startsWith('http')
      ? imagePath
      : `${MEDIA_BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
  };

  const getStatusBadge = (status) => {
    const styles = {
      available: 'bg-green-50 text-green-700 border-green-100',
      occupied: 'bg-red-50 text-red-700 border-red-100',
      maintenance: 'bg-yellow-50 text-yellow-700 border-yellow-100'
    };

    const icons = {
      available: <CheckCircleIcon className="w-3 h-3 mr-1" />,
      occupied: <XCircleIcon className="w-3 h-3 mr-1" />,
      maintenance: <ExclamationCircleIcon className="w-3 h-3 mr-1" />
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-100'}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50/50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Image
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Room Number
            </th>
            {showStatus && (
              <>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Floor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </>
            )}
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Price
            </th>
            {showActions && (
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {rooms.map((room) => (
            <tr
              key={room._id}
              className="hover:bg-gray-50/80 cursor-pointer transition-colors"
              onClick={() => onRoomClick && onRoomClick(room)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-16 w-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center relative group">
                  {room.images && room.images.length > 0 ? (
                    <img
                      src={resolveImageUrl(room.images[0])}
                      alt={`Room ${room.number}`}
                      className="h-full w-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}

                  <div className={`w-full h-full flex items-center justify-center bg-gray-50 ${room.images && room.images.length > 0 ? 'hidden' : ''}`}>
                    <PhotoIcon className="w-6 h-6 text-gray-300" />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-bold text-gray-900">Room {room.number}</span>
              </td>
              {showStatus && (
                <>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                      {room.floor}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <TagIcon className="w-4 h-4 text-gray-400" />
                      <span className="capitalize">{room.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <UserGroupIcon className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{room.occupied || 0}</span>
                      <span className="text-gray-400">/</span>
                      <span>{room.capacity}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(room.status)}
                  </td>
                </>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-primary-600">
                ₱{room.monthlyRate ? room.monthlyRate.toLocaleString() : '5,000'}<span className="text-gray-400 font-normal text-xs ml-1">/mo</span>
              </td>
              {showActions && actions && (
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  {actions(room)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoomTable;

