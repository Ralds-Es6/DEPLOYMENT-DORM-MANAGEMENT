import RoomAssignment from '../models/RoomAssignment.js';
import Room from '../models/Room.js';

// Helper function to calculate income for assignments in a date range
const calculateIncomeForRange = (assignments, startDate, endDate) => {
  let totalIncome = 0;

  assignments.forEach(assignment => {
    const assignmentStart = new Date(assignment.startDate);
    const assignmentEnd = new Date(assignment.endDate);

    // Count assignments that are approved, active, or completed and overlap with the date range
    if (['approved', 'active', 'completed'].includes(assignment.status) && assignmentStart <= endDate && assignmentEnd >= startDate) {
      // Use stored totalPrice if available, otherwise calculate based on daily rate
      if (assignment.totalPrice) {
        totalIncome += assignment.totalPrice;
      } else {
        const room = assignment.room;
        const monthlyRate = room?.monthlyRate || 5000;
        
        // Calculate duration in days
        const diffTime = Math.abs(assignmentEnd - assignmentStart);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Calculate price based on daily rate
        const dailyRate = monthlyRate / 30;
        totalIncome += Math.round(dailyRate * diffDays);
      }
    }
  });

  return totalIncome;
};

// Helper function to calculate daily income for a specific day
// Counts income ONLY for check-in transactions that occurred on that day
const calculateDailyIncome = (assignments, dayStart, dayEnd) => {
  let totalIncome = 0;

  assignments.forEach(assignment => {
    // Only count assignments that are approved, active, or completed
    if (!['approved', 'active', 'completed'].includes(assignment.status)) {
      return;
    }

    // Get the check-in date (when the transaction occurred)
    const checkInDate = new Date(assignment.checkInTime || assignment.approvalTime || assignment.startDate);
    
    // Check if check-in occurred on this specific day
    // dayStart and dayEnd represent the 24-hour period of the target day
    if (checkInDate >= dayStart && checkInDate <= dayEnd) {
      // Use stored totalPrice if available, otherwise calculate based on daily rate
      if (assignment.totalPrice) {
        totalIncome += assignment.totalPrice;
      } else {
        const room = assignment.room;
        const monthlyRate = room?.monthlyRate || 5000;
        
        // Calculate duration in days
        const assignmentStart = new Date(assignment.startDate);
        const assignmentEnd = new Date(assignment.endDate);
        const diffTime = Math.abs(assignmentEnd - assignmentStart);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Calculate price based on daily rate
        const dailyRate = monthlyRate / 30;
        totalIncome += Math.round(dailyRate * diffDays);
      }
    }
  });

  return totalIncome;
};

// Helper function to get income data for chart
const getIncomeChartData = (assignments, period, monthOffset = 0, yearOffset = 0) => {
  const now = new Date();
  let intervals = [];
  let displayLabel = '';

  switch (period) {
    case 'monthly':
      // Calculate target month correctly
      let targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      
      // Handle year rollover when month offset goes beyond 12
      let targetYear = targetMonth.getFullYear();
      let targetMonthIndex = targetMonth.getMonth();
      
      // Apply year offset
      targetYear += yearOffset;
      
      // Create new date with corrected year/month
      targetMonth = new Date(targetYear, targetMonthIndex, 1);
      
      const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
      const monthName = targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      displayLabel = monthName;

      for (let i = 1; i <= daysInMonth; i++) {
        // Create dates using local timezone (not UTC) to match assignment dates
        const dayStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), i, 0, 0, 0, 0);
        const dayEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), i, 23, 59, 59, 999);
        intervals.push({
          label: i.toString(),
          start: dayStart,
          end: dayEnd
        });
      }
      break;
    case 'yearly':
      const targetYear2 = now.getFullYear() + yearOffset;
      displayLabel = targetYear2.toString();

      for (let i = 0; i < 12; i++) {
        const monthStart = new Date(targetYear2, i, 1, 0, 0, 0, 0);
        const monthEnd = new Date(targetYear2, i + 1, 0, 23, 59, 59, 999);
        intervals.push({
          label: new Date(targetYear2, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          start: monthStart,
          end: monthEnd
        });
      }
      break;
  }

  return {
    label: displayLabel,
    data: intervals.map(interval => ({
      label: interval.label,
      value: Math.round(calculateDailyIncome(assignments, interval.start, interval.end))
    })),
    total: intervals.reduce((sum, interval) => sum + Math.round(calculateDailyIncome(assignments, interval.start, interval.end)), 0)
  };
};

// Helper function to get check-in/check-out data for a period
const getCheckInOutData = (assignments, period, monthOffset = 0, yearOffset = 0) => {
  const now = new Date();
  let intervals = [];
  let displayLabel = '';

  switch (period) {
    case 'monthly':
      // Calculate target month correctly
      let targetMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
      
      // Handle year rollover when month offset goes beyond 12
      let targetYear = targetMonth.getFullYear();
      let targetMonthIndex = targetMonth.getMonth();
      
      // Apply year offset
      targetYear += yearOffset;
      
      // Create new date with corrected year/month
      targetMonth = new Date(targetYear, targetMonthIndex, 1);
      displayLabel = targetMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dayStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), i, 0, 0, 0, 0);
        const dayEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), i, 23, 59, 59, 999);
        intervals.push({
          dayStart,
          dayEnd,
          label: i.toString(),
          monthIndex: -1  // Not needed for monthly view
        });
      }
      break;
    case 'yearly':
      const targetYear2 = now.getFullYear() + yearOffset;
      displayLabel = targetYear2.toString();

      for (let i = 0; i < 12; i++) {
        // For yearly view, create intervals for the entire month
        const monthStart = new Date(targetYear2, i, 1, 0, 0, 0, 0);
        const monthEnd = new Date(targetYear2, i + 1, 0, 23, 59, 59, 999);
        intervals.push({
          dayStart: monthStart,
          dayEnd: monthEnd,
          label: new Date(targetYear2, i, 1).toLocaleDateString('en-US', { month: 'short' }),
          monthIndex: i  // Store month index for yearly view
        });
      }
      break;
    default:
      return { label: '', labels: [], checkIns: [], checkOuts: [] };
  }

  const checkIns = intervals.map(interval => {
    return assignments.filter(assignment => {
      // Use checkInTime or approvalTime for actual check-in date, fall back to startDate
      const checkInDate = assignment.checkInTime || assignment.approvalTime || assignment.startDate;
      if (!checkInDate) return false;

      const checkInDateObj = new Date(checkInDate);
      
      // Check if check-in date falls within the interval (dayStart to dayEnd)
      return checkInDateObj >= interval.dayStart && checkInDateObj <= interval.dayEnd && 
             ['approved', 'active', 'completed'].includes(assignment.status);
    }).length;
  });

  const checkOuts = intervals.map(interval => {
    return assignments.filter(assignment => {
      // Use checkOutTime if available, otherwise fall back to endDate for completed assignments
      const checkOutDate = assignment.checkOutTime || assignment.endDate;
      if (!checkOutDate) return false;

      const checkOutDateObj = new Date(checkOutDate);
      
      // Check if check-out date falls within the interval (dayStart to dayEnd)
      return checkOutDateObj >= interval.dayStart && checkOutDateObj <= interval.dayEnd && 
             assignment.status === 'completed';
    }).length;
  });

  const cancelled = intervals.map(interval => {
    return assignments.filter(assignment => {
      // Use updatedAt for cancellation time
      const cancelledDate = assignment.updatedAt;
      if (!cancelledDate) return false;

      const cancelledDateObj = new Date(cancelledDate);
      
      // Check if cancellation date falls within the interval (dayStart to dayEnd)
      return cancelledDateObj >= interval.dayStart && cancelledDateObj <= interval.dayEnd && 
             assignment.status === 'cancelled';
    }).length;
  });

  return {
    label: displayLabel,
    labels: intervals.map(i => i.label),
    checkIns,
    checkOuts,
    cancelled,
    totalCheckIns: checkIns.reduce((sum, count) => sum + count, 0),
    totalCheckOuts: checkOuts.reduce((sum, count) => sum + count, 0),
    totalCancelled: cancelled.reduce((sum, count) => sum + count, 0)
  };
};

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const assignments = await RoomAssignment.find()
      .populate('room', 'number type monthlyRate')
      .sort('startDate');

    const now = new Date();
    
    // Get month and year offsets from query parameters
    const monthOffset = parseInt(req.query.monthOffset) || 0;
    const yearOffset = parseInt(req.query.yearOffset) || 0;

    // Calculate total income for periods (always based on current month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const monthlyIncome = calculateIncomeForRange(assignments, monthStart, now);
    const yearlyIncome = calculateIncomeForRange(assignments, yearStart, now);

    // Get check-in/check-out data with month/year navigation support
    const monthlyCheckInOutData = getCheckInOutData(assignments, 'monthly', monthOffset, yearOffset);
    const yearlyCheckInOutData = getCheckInOutData(assignments, 'yearly', 0, yearOffset);

    // Get income chart data with month/year navigation support
    const monthlyIncomeData = getIncomeChartData(assignments, 'monthly', monthOffset, yearOffset);
    const yearlyIncomeData = getIncomeChartData(assignments, 'yearly', 0, yearOffset);

    // Debug logging
    console.log(`[Dashboard] Current date: ${now.toISOString()}`);
    console.log(`[Dashboard] Current date (local): ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`);
    console.log(`[Dashboard] Month offset: ${monthOffset}, Year offset: ${yearOffset}`);
    console.log(`[Dashboard] Monthly income data label: ${monthlyIncomeData.label}`);
    console.log(`[Dashboard] Monthly income data points: ${monthlyIncomeData.data.length}`);
    console.log(`[Dashboard] First few data points:`, monthlyIncomeData.data.slice(0, 5));

    res.json({
      income: {
        monthly: Math.round(monthlyIncome),
        yearly: Math.round(yearlyIncome),
        monthlyData: monthlyIncomeData,
        yearlyData: yearlyIncomeData
      },
      checkInOut: {
        monthly: monthlyCheckInOutData,
        yearly: yearlyCheckInOutData
      }
    });
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    res.status(500).json({ message: error.message });
  }
};
