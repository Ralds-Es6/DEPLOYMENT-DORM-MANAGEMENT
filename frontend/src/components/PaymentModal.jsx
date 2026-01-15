import { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, PhotoIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { getSettings } from '../api/settings';
import { submitPayment } from '../api/payment';

import { MEDIA_BASE_URL } from '../api/apiConfig';

const PaymentModal = ({ isOpen, onClose, booking, onSuccess }) => {
    const [method, setMethod] = useState('gcash'); // 'gcash' or 'cash'
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingSettings, setLoadingSettings] = useState(true);

    // Form State
    const [amount, setAmount] = useState(booking?.totalPrice || 0);
    const [referenceNumber, setReferenceNumber] = useState('');
    const [proofImage, setProofImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const prevBookingIdRef = useRef(null);

    useEffect(() => {
        if (isOpen && booking && booking._id !== prevBookingIdRef.current) {
            fetchSettings();
            // Reset form
            setMethod('gcash');
            setReferenceNumber('');
            setProofImage(null);
            setPreviewUrl(null);
            setAmount(booking?.totalPrice || 0);
            prevBookingIdRef.current = booking._id;
        } else if (isOpen && !prevBookingIdRef.current) {
            // First open initialization if ref was null
            fetchSettings();
            setAmount(booking?.totalPrice || 0);
            prevBookingIdRef.current = booking?._id;
        }
    }, [isOpen, booking]);

    const fetchSettings = async () => {
        try {
            setLoadingSettings(true);
            const data = await getSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings");
        } finally {
            setLoadingSettings(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProofImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const paymentData = {
                roomAssignmentId: booking._id,
                amount,
                paymentMethod: method,
                referenceNumber: method === 'gcash' ? referenceNumber : null,
                proofImage: method === 'gcash' ? proofImage : null
            };

            await submitPayment(paymentData);
            toast.success('Payment submitted successfully!');
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit payment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                    {/* Header */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <Dialog.Title className="text-xl font-display font-bold text-gray-900">
                                Complete Payment for Booking
                            </Dialog.Title>
                            <p className="text-sm text-gray-500 mt-1">Ref: <span className="font-mono font-medium text-primary-600">{booking?.referenceNumber}</span></p>
                        </div>
                        <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-500 rounded-full hover:bg-gray-100">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Method Selection */}
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-8">
                            <button
                                onClick={() => setMethod('gcash')}
                                className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2
                  ${method === 'gcash'
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                            >
                                <div className="font-bold text-lg">GCash</div>
                                <span className="text-xs opacity-75">Pay online & upload proof</span>
                            </button>

                            <button
                                onClick={() => setMethod('cash')}
                                className={`flex-1 py-4 px-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2
                  ${method === 'cash'
                                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                            >
                                <div className="font-bold text-lg">Cash / Counter</div>
                                <span className="text-xs opacity-75">Pay at the office</span>
                            </button>
                        </div>

                        {method === 'gcash' ? (
                            <div className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Left: QR Code */}
                                <div className="bg-blue-50/50 rounded-2xl p-6 flex flex-col items-center text-center border border-blue-100">
                                    <h3 className="font-bold text-gray-900 mb-4">Scan to Pay</h3>
                                    {loadingSettings ? (
                                        <div className="w-48 h-48 bg-gray-200 rounded-lg animate-pulse" />
                                    ) : settings?.paymentQrCode ? (
                                        <img
                                            src={`${MEDIA_BASE_URL}${settings.paymentQrCode}`}
                                            alt="GCash QR"
                                            className="w-56 h-auto rounded-lg shadow-sm border border-white"
                                        />
                                    ) : (
                                        <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                                            No QR Code Uploaded
                                        </div>
                                    )}

                                    <div className="mt-4 space-y-1">
                                        <p className="font-medium text-gray-900">{settings?.gcashName || 'Admin'}</p>
                                        <p className="font-mono text-gray-600">{settings?.gcashNumber}</p>
                                    </div>
                                </div>

                                {/* Right: Upload Form */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-gray-500">₱</span>
                                            <input
                                                type="number"
                                                value={amount}
                                                readOnly // Fixed amount based on booking
                                                className="w-full pl-8 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. 1234 5678 9012"
                                            value={referenceNumber}
                                            onChange={(e) => setReferenceNumber(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-shadow"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Payment <span className="text-red-500">*</span></label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:bg-gray-50 transition-colors relative group">
                                            <div className="space-y-1 text-center">
                                                {previewUrl ? (
                                                    <div className="relative">
                                                        <img src={previewUrl} alt="Preview" className="mx-auto h-32 object-contain rounded-lg" />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                                            Change Image
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                                                        <div className="flex text-sm text-gray-600">
                                                            <span className="relative rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                                                                Upload a file
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                                                    </>
                                                )}
                                                <input type="file" required={!proofImage} onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="text-center py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircleIcon className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Instructions for Cash Payment</h3>
                                <p className="text-gray-600 max-w-md mx-auto mb-8">
                                    Please visit the administration office and present your booking reference number <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{booking?.referenceNumber}</span> to complete your payment.
                                </p>
                                <p className="text-sm text-gray-500">
                                    Your booking will remain pending until payment is received.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || (method === 'gcash' && (!referenceNumber || !proofImage))}
                            className={`px-6 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors
                ${loading || (method === 'gcash' && (!referenceNumber || !proofImage))
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-primary-600 hover:bg-primary-700 shadow-sm'}`}
                        >
                            {loading ? 'Processing...' : method === 'gcash' ? 'Submit Payment' : 'Confirm Cash Payment'}
                        </button>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    );
};

export default PaymentModal;
