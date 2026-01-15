import SystemSettings from '../models/SystemSettings.js';
import path from 'path';
import fs from 'fs';

// Get current settings
export const getSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create({});
        }
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update settings (including QR code upload)
export const updateSettings = async (req, res) => {
    try {
        const { gcashName, gcashNumber, paymentInstructions } = req.body;
        let updateData = {
            gcashName,
            gcashNumber,
            paymentInstructions
        };

        if (req.file) {
            // If a new QR code is uploaded
            updateData.paymentQrCode = `/uploads/${req.file.filename}`;
        }

        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = await SystemSettings.create(updateData);
        } else {
            // If updating usage of image, maybe delete old one? 
            // For now, simple update
            settings = await SystemSettings.findOneAndUpdate({}, updateData, { new: true });
        }

        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
