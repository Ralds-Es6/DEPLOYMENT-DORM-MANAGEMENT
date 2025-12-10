import Report from '../models/Report.js';
import RoomAssignment from '../models/RoomAssignment.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Private (User)
export const submitReport = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;

  if (!title || !description) {
    return res.status(400).json({
      success: false,
      message: 'Title and description are required'
    });
  }

  // Get user's current active room assignment
  const currentAssignment = await RoomAssignment.findOne({
    requestedBy: req.user._id,
    status: { $in: ['active', 'approved'] }
  })
    .populate('room', 'number type monthlyRate')
    .sort({ createdAt: -1 })
    .lean();

  const report = await Report.create({
    userId: req.user._id,
    currentRoomId: currentAssignment?.room?._id || null,
    title,
    description,
    category: category || 'other'
  });

  // Populate the response with full details
  const populatedReport = await Report.findById(report._id)
    .populate('userId', 'username email userId')
    .populate('currentRoomId', 'number type monthlyRate');

  res.status(201).json({
    success: true,
    message: 'Report submitted successfully',
    data: populatedReport
  });
});

// @desc    Get user's reports
// @route   GET /api/reports/my-reports
// @access  Private (User)
export const getUserReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ userId: req.user._id })
    .populate('userId', 'username email userId')
    .populate('currentRoomId', 'number type monthlyRate')
    .populate('resolvedBy', 'username email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: reports
  });
});

// @desc    Get all reports (Admin only)
// @route   GET /api/reports
// @access  Private (Admin)
export const getAllReports = asyncHandler(async (req, res) => {
  const reports = await Report.find()
    .populate('userId', 'username email userId')
    .populate('currentRoomId', 'number type monthlyRate')
    .populate('resolvedBy', 'username email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: reports
  });
});

// @desc    Get single report by ID
// @route   GET /api/reports/:id
// @access  Private
export const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('userId', 'username email userId')
    .populate('currentRoomId', 'number type monthlyRate')
    .populate('resolvedBy', 'username email');

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  res.status(200).json({
    success: true,
    data: report
  });
});

// @desc    Update report status and add remarks (Admin only)
// @route   PUT /api/reports/:id
// @access  Private (Admin)
export const updateReport = asyncHandler(async (req, res) => {
  const { status, adminRemarks } = req.body;

  if (!status || !['pending', 'in-review', 'resolved'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Valid status is required (pending, in-review, resolved)'
    });
  }

  const report = await Report.findById(req.params.id);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  report.status = status;
  if (adminRemarks) {
    report.adminRemarks = adminRemarks;
  }

  if (status === 'resolved') {
    report.resolvedAt = new Date();
    report.resolvedBy = req.user._id;
  }

  await report.save();

  res.status(200).json({
    success: true,
    message: 'Report updated successfully',
    data: report
  });
});

// @desc    Delete report (Admin only)
// @route   DELETE /api/reports/:id
// @access  Private (Admin)
export const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findByIdAndDelete(req.params.id);

  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'Report not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Report deleted successfully'
  });
});
