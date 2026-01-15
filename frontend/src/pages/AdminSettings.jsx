import { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  UsersIcon,
  CreditCardIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import {
  getAllAdmins,
  createAdminAccount,
  updateAdminAccount,
  deleteAdminAccount
} from '../api/adminService';
import { getSettings, updateSettings } from '../api/settings';

import { MEDIA_BASE_URL } from '../api/apiConfig';

const AdminSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('admins'); // 'admins' or 'payments'

  // Admin Management State
  const [admins, setAdmins] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [expandedAdmin, setExpandedAdmin] = useState(null);
  const [adminFormData, setAdminFormData] = useState({ name: '', email: '', password: '' });

  // Payment Settings State
  const [settings, setSettings] = useState({
    gcashName: '',
    gcashNumber: '',
    paymentInstructions: '',
    paymentQrCode: null
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [newQrFile, setNewQrFile] = useState(null);

  // Common State
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    fetchAdmins();
    fetchSystemSettings();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoadingAdmins(true);
      const response = await getAllAdmins();
      setAdmins(response.data || []);
    } catch (error) {
      console.error('Failed to load admins');
    } finally {
      setLoadingAdmins(false);
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
      if (data.paymentQrCode) {
        setPreviewUrl(`${MEDIA_BASE_URL}${data.paymentQrCode}`);
      }
    } catch (error) {
      console.error('Failed to load settings');
    }
  };

  // --- Payment Settings Handlers ---
  const handleSettingsChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewQrFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const updateData = {
        gcashName: settings.gcashName,
        gcashNumber: settings.gcashNumber,
        paymentInstructions: settings.paymentInstructions,
        paymentQrCode: newQrFile // Logic will handle if this is null
      };

      const updated = await updateSettings(updateData);
      setSettings(updated);
      setSuccessMessage('Payment settings updated successfully!');
      setNewQrFile(null); // Reset pending file
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSubmitLoading(false);
    }
  };

  // --- Admin Management Handlers (Existing) ---
  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      await createAdminAccount(adminFormData);
      setSuccessMessage('Admin account created successfully!');
      setShowCreateModal(false);
      setAdminFormData({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to create admin');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const updateData = {
        name: adminFormData.name,
        email: adminFormData.email
      };
      if (adminFormData.password) updateData.password = adminFormData.password;

      await updateAdminAccount(selectedAdmin._id, updateData);
      setSuccessMessage('Admin account updated successfully!');
      setShowEditModal(false);
      fetchAdmins();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to update admin');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteAdmin = async () => {
    setSubmitLoading(true);
    try {
      await deleteAdminAccount(selectedAdmin._id);
      setSuccessMessage('Admin deleted successfully!');
      setShowDeleteModal(false);
      fetchAdmins();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to delete admin');
    } finally {
      setSubmitLoading(false);
    }
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setAdminFormData({ name: admin.name, email: admin.email, password: '' });
    setShowEditModal(true);
  };

  const openDeleteModal = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const toggleExpandAdmin = (id) => {
    setExpandedAdmin(expandedAdmin === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 lg:p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
          <p className="text-gray-500 mt-1">Configure system preferences and manage administrators.</p>
        </div>

        {/* Global Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100 mb-8 w-fit">
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'admins'
              ? 'bg-primary-50 text-primary-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <UsersIcon className="w-4 h-4" />
            Administrators
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'payments'
              ? 'bg-primary-50 text-primary-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            <CreditCardIcon className="w-4 h-4" />
            Payment Settings
          </button>
        </div>

        {/* Content Area */}
        <div className="animate-in fade-in duration-300">

          {/* --- ADMINS TAB --- */}
          {activeTab === 'admins' && (
            <div>
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => {
                    setAdminFormData({ name: '', email: '', password: '' });
                    setShowCreateModal(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 shadow-sm shadow-primary-200 transition-all hover:-translate-y-0.5"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Admin
                </button>
              </div>

              {loadingAdmins ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {admins.map((admin) => (
                    <div key={admin._id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-gray-900">{admin.name}</h3>
                              {admin.isSuperAdmin && (
                                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-bold">SUPER ADMIN</span>
                              )}
                            </div>
                            <p className="text-gray-500 text-sm">{admin.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!admin.isSuperAdmin && user.isSuperAdmin && (
                            <>
                              <button onClick={() => openEditModal(admin)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <PencilIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => openDeleteModal(admin)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <TrashIcon className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button onClick={() => toggleExpandAdmin(admin._id)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedAdmin === admin._id ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {expandedAdmin === admin._id && (
                        <div className="mt-4 pt-4 border-t border-gray-100 grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <p>ID: <span className="font-mono">{admin._id}</span></p>
                          <p>Created: {new Date(admin.createdAt).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* --- PAYMENT SETTINGS TAB --- */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">GCash Configuration</h2>
                <p className="text-gray-500 text-sm mt-1">Manage the details shown to users when paying via GCash.</p>
              </div>

              <div className="p-6 grid md:grid-cols-2 gap-12">
                {/* Form Side */}
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Name</label>
                    <input
                      type="text"
                      name="gcashName"
                      value={settings.gcashName || ''}
                      onChange={handleSettingsChange}
                      placeholder="e.g. Juan De La Cruz"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">GCash Number</label>
                    <input
                      type="text"
                      name="gcashNumber"
                      value={settings.gcashNumber || ''}
                      onChange={handleSettingsChange}
                      placeholder="e.g. 0917 123 4567"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Instructions</label>
                    <textarea
                      name="paymentInstructions"
                      value={settings.paymentInstructions || ''}
                      onChange={handleSettingsChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 shadow-md shadow-primary-200 transition-all disabled:opacity-50"
                  >
                    {submitLoading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </form>

                {/* QR Code Side */}
                <div className="flex flex-col items-center">
                  <label className="block text-sm font-medium text-gray-700 mb-4 w-full text-left">QR Code Image</label>

                  <div className="relative group w-64 h-80 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center p-4 overflow-hidden hover:bg-gray-100 transition-colors cursor-pointer">
                    {previewUrl ? (
                      <img src={previewUrl} alt="QR Code Preview" className="w-full h-full object-contain" />
                    ) : (
                      <>
                        <PhotoIcon className="w-12 h-12 text-gray-300 mb-2" />
                        <span className="text-sm text-gray-500">No image uploaded</span>
                      </>
                    )}

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">
                      Click to Change
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQrUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Click to upload new QR Code</p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Admin Modals (Create/Edit/Delete) - Same as before but minimized for brevity */}
      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in">
            <h2 className="text-2xl font-bold mb-6">Create Admin</h2>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <input
                type="text" placeholder="Name" required
                value={adminFormData.name} onChange={handleAdminFormChange} name="name"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="email" placeholder="Email" required
                value={adminFormData.email} onChange={handleAdminFormChange} name="email"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="password" placeholder="Password" required
                value={adminFormData.password} onChange={handleAdminFormChange} name="password"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitLoading} className="flex-1 py-2 bg-primary-600 text-white rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in">
            <h2 className="text-2xl font-bold mb-6">Edit Admin</h2>
            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <input
                type="text" placeholder="Name" required
                value={adminFormData.name} onChange={handleAdminFormChange} name="name"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="email" placeholder="Email" required
                value={adminFormData.email} onChange={handleAdminFormChange} name="email"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <input
                type="password" placeholder="New Password (Optional)"
                value={adminFormData.password} onChange={handleAdminFormChange} name="password"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                <button type="submit" disabled={submitLoading} className="flex-1 py-2 bg-primary-600 text-white rounded-lg">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Admin Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrashIcon className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Delete Admin?</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete {selectedAdmin?.name}?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
              <button type="button" onClick={handleDeleteAdmin} disabled={submitLoading} className="flex-1 py-2 bg-red-600 text-white rounded-lg">Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSettings;
