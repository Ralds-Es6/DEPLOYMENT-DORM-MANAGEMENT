import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { submitPayment, getPayments, verifyPayment } from '../controllers/paymentController.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// File upload configuration
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

// Check file type
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

// Routes
router.route('/')
    .post(protect, upload.single('proofImage'), submitPayment)
    .get(protect, getPayments);

router.route('/:paymentId/verify')
    .put(protect, admin, verifyPayment);

export default router;
