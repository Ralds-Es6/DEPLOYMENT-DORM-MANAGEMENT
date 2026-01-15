import { useState, useEffect } from 'react';
import {
    CheckCircleIcon,
    XCircleIcon,
    MagnifyingGlassIcon,
    CreditCardIcon,
    CalendarIcon,
    PhotoIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getPayments, verifyPayment } from '../api/payment';
import Modal from '../components/Modal';

import { MEDIA_BASE_URL } from '../api/apiConfig';

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, verified, rejected
    const [selectedProof, setSelectedProof] = useState(null);
    const [remarks, setRemarks] = useState('');
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const data = await getPayments();
            // Ensure backend returns data properly
            setPayments(Array.isArray(data) ? data : []);
        } catch (error) {
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (id, status) => {
        try {
            setProcessingId(id);
            await verifyPayment(id, status, remarks);
            toast.success(`Payment ${status} successfully`);
            fetchPayments(); // Refresh list
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setProcessingId(null);
            setRemarks('');
        }
    };

    const filteredPayments = payments.filter(p => {
        if (filter === 'all') return true;
        return p.status === filter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'verified': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-gray-900">Payment Transactions</h1>
                    <p className="text-gray-500 mt-1">Manage and verify GCash and cash payments</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                    {['all', 'pending', 'verified', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${filter === f
                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CreditCardIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No {filter !== 'all' ? filter : ''} payments found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Booking Ref</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amount / Method</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Proof</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredPayments.map((payment) => (
                                    <tr key={payment._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                    {payment.user?.name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{payment.user?.name || 'Unknown'}</p>
                                                    <p className="text-xs text-gray-500">{new Date(payment.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.roomAssignment ? (
                                                <div>
                                                    <p className="text-sm font-mono font-medium text-gray-900">{payment.roomAssignment.referenceNumber}</p>
                                                    <p className="text-xs text-gray-500">Room {payment.roomAssignment.room?.number}</p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-sm">Deleted Booking</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">₱{payment.amount?.toLocaleString()}</p>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className={`w-1.5 h-1.5 rounded-full ${payment.paymentMethod === 'gcash' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                                                    <p className="text-xs text-gray-500 capitalize">{payment.paymentMethod}</p>
                                                </div>
                                                {payment.referenceNumber && (
                                                    <p className="text-xs font-mono text-gray-400 mt-0.5">Ref: {payment.referenceNumber}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {payment.proofImage ? (
                                                <button
                                                    onClick={() => setSelectedProof(`${MEDIA_BASE_URL}${payment.proofImage}`)}
                                                    className="group relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-500 transition-colors"
                                                >
                                                    <img
                                                        src={`${MEDIA_BASE_URL}${payment.proofImage}`}
                                                        alt="Proof"
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MagnifyingGlassIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                </button>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">No Image</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)} capitalize`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {payment.status === 'pending' && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleVerify(payment._id, 'verified')}
                                                        disabled={!!processingId}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Verify Payment"
                                                    >
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerify(payment._id, 'rejected')}
                                                        disabled={!!processingId}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Reject Payment"
                                                    >
                                                        <XCircleIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Proof Modal */}
            {selectedProof && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedProof(null)}>
                    <img
                        src={selectedProof}
                        alt="Proof Fullscreen"
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                    />
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300"
                        onClick={() => setSelectedProof(null)}
                    >
                        <XCircleIcon className="w-8 h-8" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminPayments;
