import api from './apiConfig';

// Get System Settings (Publicly accessible for QR display)
export const getSettings = async () => {
    const response = await api.get('/settings');
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

    const response = await api.put('/settings', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
