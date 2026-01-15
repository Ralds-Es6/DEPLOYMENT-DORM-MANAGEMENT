import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema(
    {
        paymentQrCode: {
            type: String, // URL to the QR Code image
            default: null
        },
        gcashName: {
            type: String,
            default: ''
        },
        gcashNumber: {
            type: String,
            default: ''
        },
        paymentInstructions: {
            type: String,
            default: 'Please scan the QR code and upload your proof of payment.'
        }
    },
    {
        timestamps: true
    }
);

// We usually only have ONE settings document, so we can use a singleton pattern in the controller
const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
