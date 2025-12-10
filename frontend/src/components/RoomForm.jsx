import { useState, useEffect } from 'react';
import useFormValidation from '../hooks/useFormValidation';
import toast from 'react-hot-toast';
import ConfirmationModal from './ConfirmationModal';
import { MEDIA_BASE_URL } from '../api/apiConfig';
import {
  PhotoIcon,
  XCircleIcon,
  CheckCircleIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  TagIcon,
  ListBulletIcon,
  TrashIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const MAX_IMAGES = 5;

const AMENITIES_LIST = [
  "Air Conditioning",
  "Wi-Fi",
  "Private Bathroom",
  "Study Desk",
  "Wardrobe",
  "Balcony",
  "Kitchenette",
  "Smart TV",
  "Water Heater",
  "Refrigerator"
];

const RoomForm = ({ room, onSubmit, onCancel }) => {
  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: null, success: false });
  const [existingImages, setExistingImages] = useState(room?.images || []);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState(null);

  const validationRules = {
    roomNumber: {
      required: true,
      pattern: /^[A-Z0-9-]+$/,
      message: 'Room number must contain only uppercase letters, numbers, and hyphens'
    },
    floor: {
      required: true,
      pattern: /^[0-9]+$/,
      message: 'Floor must be a valid number'
    },
    capacity: {
      required: true,
      pattern: /^[1-6]$/,
      message: 'Capacity must be between 1 and 6'
    },
    type: {
      required: true
    },
    monthlyRate: {
      required: false
    },
    description: {
      required: false
    },
    amenities: {
      required: false
    }
  };

  const initialValues = {
    roomNumber: room?.number || '',
    floor: room?.floor || '',
    capacity: room?.capacity || '',
    type: room?.type || '',
    status: room?.status || 'available',
    monthlyRate: room?.monthlyRate || '',
    description: room?.description || '',
    amenities: room?.amenities ? (Array.isArray(room.amenities) ? room.amenities : room.amenities.split(',')) : []
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validate,
    setValues
  } = useFormValidation(initialValues, validationRules);

  useEffect(() => {
    if (room) {
      setValues({
        roomNumber: room.number || '',
        floor: room.floor || '',
        capacity: room.capacity || '',
        type: room.type || '',
        status: room.status || 'available',
        monthlyRate: room.monthlyRate || '',
        description: room.description || '',
        amenities: Array.isArray(room.amenities) ? room.amenities : (room.amenities ? room.amenities.split(',') : [])
      });
      setExistingImages(room.images || []);
    } else {
      setExistingImages([]);
    }
    setPendingUploads([]);
  }, [room, setValues]);

  useEffect(() => {
    return () => {
      pendingUploads.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, [pendingUploads]);

  const handleAmenityChange = (amenity) => {
    const currentAmenities = Array.isArray(values.amenities) ? values.amenities : [];
    let newAmenities;
    if (currentAmenities.includes(amenity)) {
      newAmenities = currentAmenities.filter(a => a !== amenity);
    } else {
      newAmenities = [...currentAmenities, amenity];
    }
    setValues(prev => ({ ...prev, amenities: newAmenities }));
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';

    if (!files.length) {
      return;
    }

    const availableSlots = MAX_IMAGES - (existingImages.length + pendingUploads.length);
    if (availableSlots <= 0) {
      toast.error(`You can only upload up to ${MAX_IMAGES} images per room.`);
      return;
    }

    const selectedFiles = files.slice(0, availableSlots);
    const uploads = selectedFiles.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setPendingUploads((prev) => [...prev, ...uploads]);
  };

  const handleRemoveExistingImage = (imagePath) => {
    setExistingImages((prev) => prev.filter((img) => img !== imagePath));
  };

  const handleRemovePendingImage = (imageId) => {
    setPendingUploads((prev) => {
      const target = prev.find((img) => img.id === imageId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((img) => img.id !== imageId);
    });
  };

  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return '';
    return imagePath.startsWith('http')
      ? imagePath
      : `${MEDIA_BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields correctly');
      setSubmitStatus({ loading: false, error: 'Please fill in all required fields correctly', success: false });
      return;
    }

    if (room && room.occupied >= room.capacity && values.status === 'available') {
      toast.error('Cannot set a fully occupied room to available. Please ensure the room has available space first.');
      setSubmitStatus({ loading: false, error: 'Cannot set a fully occupied room to available', success: false });
      return;
    }

    // Check if trying to set room to occupied when not fully occupied
    const currentOccupancy = room ? room.occupied : 0;
    const newCapacity = parseInt(values.capacity, 10) || 0;
    
    if (values.status === 'occupied' && currentOccupancy < newCapacity) {
      toast.error('Cannot set room to occupied. The room is not fully occupied yet.');
      setSubmitStatus({ loading: false, error: 'Cannot set room to occupied. The room is not fully occupied yet.', success: false });
      return;
    }

    // Show confirmation modal instead of directly submitting
    setFormDataToSubmit({
      number: values.roomNumber.trim(),
      floor: values.floor,
      capacity: values.capacity,
      type: values.type,
      status: values.status,
      monthlyRate: values.monthlyRate || 0,
      description: values.description || '',
      amenities: values.amenities || []
    });
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    try {
      setSubmitStatus({ loading: true, error: null, success: false });
      
      const formData = new FormData();
      formData.append('number', formDataToSubmit.number);
      formData.append('floor', formDataToSubmit.floor);
      formData.append('capacity', formDataToSubmit.capacity);
      formData.append('type', formDataToSubmit.type);
      formData.append('status', formDataToSubmit.status);
      formData.append('monthlyRate', formDataToSubmit.monthlyRate);
      formData.append('description', formDataToSubmit.description);
      formData.append('amenities', JSON.stringify(formDataToSubmit.amenities));
      formData.append('existingImages', JSON.stringify(existingImages));
      pendingUploads.forEach(({ file }) => formData.append('images', file));

      const success = await onSubmit(formData);
      if (success) {
        setSubmitStatus({ loading: false, error: null, success: true });
        setPendingUploads([]);
        setShowConfirmation(false);

        if (room) {
          if (room.status !== formDataToSubmit.status) {
            toast.success(`Room status successfully changed to ${formDataToSubmit.status}`);
          } else {
            toast.success('Room updated successfully');
          }
        } else {
          toast.success('Room created successfully');
        }

        setTimeout(() => {
          setSubmitStatus((prev) => ({ ...prev, success: false }));
        }, 3000);
      } else {
        setSubmitStatus({ loading: false, error: 'Failed to save room', success: false });
      }
    } catch (error) {
      console.error('Room submission error:', error);
      toast.error(error.message || 'Failed to save room');
      setSubmitStatus({ loading: false, error: error.message, success: false });
    }
  };

  const showcaseCount = existingImages.length + pendingUploads.length;
  const remainingSlots = Math.max(0, MAX_IMAGES - showcaseCount);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      {submitStatus.success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-r-xl shadow-sm flex items-center gap-2 animate-fade-in">
          <CheckCircleIcon className="w-5 h-5" />
          <p className="font-medium">Room details saved successfully!</p>
        </div>
      )}

      {submitStatus.error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm flex items-center gap-2 animate-fade-in">
          <XCircleIcon className="w-5 h-5" />
          <p className="font-medium">{submitStatus.error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Room Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="roomNumber"
              value={values.roomNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`pl-10 block w-full rounded-xl shadow-sm transition-all ${touched.roomNumber && errors.roomNumber
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                }`}
              placeholder="e.g. A-101"
            />
          </div>
          {touched.roomNumber && errors.roomNumber && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <XCircleIcon className="w-4 h-4" /> {errors.roomNumber}
            </p>
          )}
        </div>

        {/* Floor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="floor"
              value={values.floor || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`pl-10 block w-full rounded-xl shadow-sm transition-all ${touched.floor && errors.floor
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                }`}
              placeholder="e.g. 1"
            />
          </div>
          {touched.floor && errors.floor && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <XCircleIcon className="w-4 h-4" /> {errors.floor}
            </p>
          )}
        </div>

        {/* Capacity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              name="capacity"
              value={values.capacity || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`pl-10 block w-full rounded-xl shadow-sm transition-all ${touched.capacity && errors.capacity
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                }`}
            >
              <option value="">Select Capacity</option>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} Person{num > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
          {touched.capacity && errors.capacity && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <XCircleIcon className="w-4 h-4" /> {errors.capacity}
            </p>
          )}
        </div>

        {/* Room Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <TagIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              name="type"
              value={values.type || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`pl-10 block w-full rounded-xl shadow-sm transition-all ${touched.type && errors.type
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                }`}
            >
              <option value="">Select Room Type</option>
              <option value="Standard">Standard</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Suite">Suite</option>
            </select>
          </div>
          {touched.type && errors.type && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <XCircleIcon className="w-4 h-4" /> {errors.type}
            </p>
          )}
        </div>

        {/* Monthly Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rate</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              name="monthlyRate"
              value={values.monthlyRate || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="0.00"
              step="0.01"
              className={`pl-10 block w-full rounded-xl shadow-sm transition-all ${touched.monthlyRate && errors.monthlyRate
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-200 focus:border-primary-500 focus:ring-primary-500'
                }`}
            />
          </div>
          {touched.monthlyRate && errors.monthlyRate && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <XCircleIcon className="w-4 h-4" /> {errors.monthlyRate}
            </p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CheckCircleIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              name="status"
              value={values.status || 'available'}
              onChange={handleChange}
              onBlur={handleBlur}
              className="pl-10 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <div className="relative">
          <div className="absolute top-3 left-3 pointer-events-none">
            <DocumentTextIcon className="h-5 w-5 text-gray-400" />
          </div>
          <textarea
            name="description"
            value={values.description || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            rows="3"
            className="pl-10 block w-full rounded-xl border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 transition-all"
            placeholder="Enter room description..."
          />
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AMENITIES_LIST.map((amenity) => (
            <label key={amenity} className="flex items-center space-x-2 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={Array.isArray(values.amenities) && values.amenities.includes(amenity)}
                onChange={() => handleAmenityChange(amenity)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Showcase images */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-900">Room Showcase</label>
            <p className="text-xs text-gray-500">Upload up to {MAX_IMAGES} high-quality images to highlight the interior.</p>
          </div>
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${showcaseCount >= MAX_IMAGES ? 'bg-red-100 text-red-700' : 'bg-primary-100 text-primary-700'
            }`}>
            {showcaseCount}/{MAX_IMAGES}
          </span>
        </div>

        <div className="mt-3">
          <label
            htmlFor="room-images-upload"
            className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed transition-all duration-200 group ${remainingSlots > 0
                ? 'border-primary-200 hover:border-primary-400 hover:bg-primary-50 cursor-pointer'
                : 'border-gray-200 bg-gray-50 cursor-not-allowed'
              } px-4 py-8 text-center`}
          >
            <input
              id="room-images-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageChange}
              disabled={remainingSlots === 0}
            />
            <div className={`p-3 rounded-full mb-3 transition-colors ${remainingSlots > 0 ? 'bg-primary-100 text-primary-600 group-hover:bg-primary-200' : 'bg-gray-100 text-gray-400'
              }`}>
              <PhotoIcon className="h-8 w-8" />
            </div>
            <p className={`text-sm font-medium ${remainingSlots > 0 ? 'text-gray-900' : 'text-gray-500'}`}>
              {remainingSlots > 0 ? 'Click to upload or drag images here' : 'Image limit reached'}
            </p>
            {remainingSlots > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                You can add {remainingSlots} more image{remainingSlots === 1 ? '' : 's'}
              </p>
            )}
          </label>

          {(existingImages.length > 0 || pendingUploads.length > 0) && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {existingImages.map((imagePath) => (
                <div key={imagePath} className="group relative aspect-video w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                  <img src={resolveImageUrl(imagePath)} alt="Room interior" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(imagePath)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-red-600 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {pendingUploads.map((image) => (
                <div key={image.id} className="group relative aspect-video w-full overflow-hidden rounded-xl border border-primary-200 shadow-sm ring-2 ring-primary-100">
                  <img src={image.previewUrl} alt="New room interior preview" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-primary-900/0 transition-colors group-hover:bg-primary-900/20" />
                  <span className="absolute left-2 top-2 rounded-lg bg-primary-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                    New
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePendingImage(image.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-red-600 opacity-0 shadow-sm transition-all group-hover:opacity-100 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitStatus.loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitStatus.loading}
          className="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 shadow-lg shadow-primary-600/20 transition-all"
        >
          {submitStatus.loading ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
        </button>
      </div>
    </form>

    {/* Confirmation Modal */}
    <ConfirmationModal
      isOpen={showConfirmation}
      title={room ? "Update Room?" : "Create Room?"}
      message={room 
        ? `Are you sure you want to update Room ${formDataToSubmit?.number}?`
        : `Are you sure you want to create Room ${formDataToSubmit?.number}?`
      }
      onConfirm={handleConfirmSubmit}
      onCancel={() => setShowConfirmation(false)}
      confirmText={room ? "Update" : "Create"}
      cancelText="Cancel"
      isLoading={submitStatus.loading}
      variant="success"
    />
    </>
  );
};

export default RoomForm;
