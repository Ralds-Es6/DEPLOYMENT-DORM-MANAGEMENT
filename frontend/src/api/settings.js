import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeader = () => {
    const admin = JSON.parse(localStorage.getItem('adminInfo'));
    const user = JSON.parse(localStorage.getItem('userInfo'));
    const token = admin?.token || user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get System Settings (Publicly accessible for QR display)
export const getSettings = async () => {
    const response = await axios.get(`${API_URL}/settings`);
    return response.data;
};

// Update Settings (Admin only, supports file upload)
export const updateSettings = async (data) => {
    const formData = new FormData();
    formData.append('gcashName', data.gcashName);
    formData.append('gcashNumber', data.gcashNumber);
    formData.append('paymentInstructions', data.paymentInstructions);

    if (data.paymentQrCode instanceof File) {
        formData.append('paymentQrCode', data.paymentQrCode);
    }

    const response = await axios.put(`${API_URL}/settings`, formData, {
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
