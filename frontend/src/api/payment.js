import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create API instance with token
const getAuthHeader = () => {
    const admin = JSON.parse(localStorage.getItem('adminInfo'));
    const user = JSON.parse(localStorage.getItem('userInfo'));
    const token = admin?.token || user?.token;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Submit Payment (with file upload)
export const submitPayment = async (data) => {
    const formData = new FormData();
    formData.append('roomAssignmentId', data.roomAssignmentId);
    formData.append('amount', data.amount);
    formData.append('paymentMethod', data.paymentMethod);

    if (data.referenceNumber) {
        formData.append('referenceNumber', data.referenceNumber);
    }

    if (data.proofImage) {
        formData.append('proofImage', data.proofImage);
    }

    const response = await axios.post(`${API_URL}/payments`, formData, {
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Get Payments (User: My Payments, Admin: All)
export const getPayments = async () => {
    const response = await axios.get(`${API_URL}/payments`, {
        headers: getAuthHeader(),
    });
    return response.data;
};

// Verify Payment (Admin)
export const verifyPayment = async (paymentId, status, remarks = '') => {
    const response = await axios.put(
        `${API_URL}/payments/${paymentId}/verify`,
        { status, remarks },
        { headers: getAuthHeader() }
    );
    return response.data;
};
