import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getSettings, updateSettings } from '../controllers/systemSettingsController.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// File upload configuration for QR Code
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `qrcode-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb('Images only!');
    }
}

router.route('/')
    .get(getSettings) // Publicly accessible to show QR code
    .put(protect, admin, upload.single('paymentQrCode'), updateSettings);

export default router;
