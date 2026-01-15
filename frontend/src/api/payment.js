import api from './apiConfig';

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

    const response = await api.post('/payments', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Get Payments (User: My Payments, Admin: All)
export const getPayments = async () => {
    const response = await api.get('/payments');
    return response.data;
};

// Verify Payment (Admin)
export const verifyPayment = async (paymentId, status, remarks = '') => {
    const response = await api.put(`/payments/${paymentId}/verify`, { status, remarks });
    return response.data;
};
