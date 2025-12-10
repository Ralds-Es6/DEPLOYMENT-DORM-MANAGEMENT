import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRooms } from '../api/roomService';
import { getAssignments } from '../api/assignmentService';
import { getDashboardStats } from '../api/dashboardService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  HomeModernIcon,
  UserGroupIcon,
  KeyIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChartBarIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    occupancyRate: 0,
    pendingAssignments: 0,
    activeAssignments: 0,
    fullyOccupiedRooms: 0,
    cancelledAssignments: 0
  });
  const [chartData, setChartData] = useState({
    income: null,
    checkInOut: null
  });
  const [incomePeriod, setIncomePeriod] = useState('monthly');
  const [incomeMonthOffset, setIncomeMonthOffset] = useState(0);
  const [incomeYearOffset, setIncomeYearOffset] = useState(0);
  const [checkInOutPeriod, setCheckInOutPeriod] = useState('monthly');
  const [checkInOutMonthOffset, setCheckInOutMonthOffset] = useState(0);
  const [checkInOutYearOffset, setCheckInOutYearOffset] = useState(0);
  const [historyFilterType, setHistoryFilterType] = useState('all');
  const [checkInHistory, setCheckInHistory] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const historyItemsPerPage = 10;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Refetch income data when month/year offset changes
    const fetchIncomeData = async () => {
      try {
        const statsData = await getDashboardStats(incomeMonthOffset, incomeYearOffset);
        setChartData(prev => ({
          ...prev,
          income: statsData.income
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch income data');
      }
    };
    fetchIncomeData();
  }, [incomeMonthOffset, incomeYearOffset]);

  useEffect(() => {
    // Refetch check-in/out data when month/year offset changes
    const fetchCheckInOutData = async () => {
      try {
        const statsData = await getDashboardStats(checkInOutMonthOffset, checkInOutYearOffset);
        setChartData(prev => ({
          ...prev,
          checkInOut: statsData.checkInOut
        }));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch check-in/out data');
      }
    };
    fetchCheckInOutData();
  }, [checkInOutMonthOffset, checkInOutYearOffset]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [rooms, assignments, statsData] = await Promise.all([
        getRooms(),
        getAssignments(),
        getDashboardStats(incomeMonthOffset, incomeYearOffset)
      ]);

      const availableRooms = rooms.filter(room => room.status === 'available');
      const pendingAssignments = assignments.filter(a => a.status === 'pending');
      const activeAssignments = assignments.filter(a => a.status === 'active' || a.status === 'approved');
      const cancelledAssignments = assignments.filter(a => a.status === 'cancelled');

      const fullyOccupiedRooms = rooms.filter(room => room.occupied === room.capacity).length;
      const totalRooms = rooms.length;

      setStats({
        totalRooms: rooms.length,
        availableRooms: availableRooms.length,
        occupancyRate: totalRooms ? Math.round((fullyOccupiedRooms / totalRooms) * 100) : 0,
        pendingAssignments: pendingAssignments.length,
        activeAssignments: activeAssignments.length,
        fullyOccupiedRooms: fullyOccupiedRooms,
        cancelledAssignments: cancelledAssignments.length
      });

      setCheckInHistory(assignments);

      setChartData({
        income: statsData.income,
        checkInOut: statsData.checkInOut
      });

      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatYAxisLabel = (value) => {
    return value.toLocaleString();
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilteredHistory = () => {
    // Filter out assignments with missing user data
    let filtered = checkInHistory.filter(a => a.requestedBy && a.requestedBy._id);

    if (historyFilterType === 'all') {
      filtered = filtered;
    } else if (historyFilterType === 'active') {
      filtered = filtered.filter(assignment => (assignment.status === 'active' || assignment.status === 'approved') && assignment.status !== 'rejected');
    } else if (historyFilterType === 'completed') {
      filtered = filtered.filter(assignment => assignment.status === 'completed' || assignment.status === 'rejected');
    } else if (historyFilterType === 'cancelled') {
      filtered = filtered.filter(assignment => assignment.status === 'cancelled');
    }

    if (historySearchQuery.trim()) {
      const query = historySearchQuery.toLowerCase();
      filtered = filtered.filter(assignment =>
        assignment.referenceNumber?.toLowerCase().includes(query) ||
        assignment.requestedBy?.name?.toLowerCase().includes(query) ||
        assignment.requestedBy?.userId?.toLowerCase().includes(query) ||
        assignment.room?.number?.toString().toLowerCase().includes(query) ||
        assignment.status?.toLowerCase().includes(query) ||
        (assignment.approvalTime && new Date(assignment.approvalTime).toLocaleString().toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const getHistoryPaginatedData = () => {
    const filtered = getFilteredHistory();
    const totalPages = Math.ceil(filtered.length / historyItemsPerPage);
    const startIndex = (historyCurrentPage - 1) * historyItemsPerPage;
    const endIndex = startIndex + historyItemsPerPage;

    return {
      data: filtered.slice(startIndex, endIndex),
      totalPages,
      totalItems: filtered.length,
      currentPage: historyCurrentPage
    };
  };

  const handleHistorySearchChange = (e) => {
    setHistorySearchQuery(e.target.value);
    setHistoryCurrentPage(1);
  };

  const handleHistoryNextPage = () => {
    const { totalPages } = getHistoryPaginatedData();
    if (historyCurrentPage < totalPages) {
      setHistoryCurrentPage(historyCurrentPage + 1);
    }
  };

  const handleHistoryPreviousPage = () => {
    if (historyCurrentPage > 1) {
      setHistoryCurrentPage(historyCurrentPage - 1);
    }
  };

  const getIncomeChartData = () => {
    if (!chartData.income) return null;

    const periodData = {
      monthly: chartData.income.monthlyData,
      yearly: chartData.income.yearlyData
    };

    const currentPeriodData = periodData[incomePeriod];
    if (!currentPeriodData) return null;

    const data = currentPeriodData.data || [];

    return {
      labels: data.map(item => item.label),
      datasets: [
        {
          label: 'Income',
          data: data.map(item => item.value),
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(14, 165, 233, 0.8)');
            gradient.addColorStop(1, 'rgba(14, 165, 233, 0.2)');
            return gradient;
          },
          borderColor: 'rgba(14, 165, 233, 1)',
          borderWidth: 0,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 20,
        }
      ]
    };
  };

  const getCheckInOutChartData = () => {
    if (!chartData.checkInOut) return null;

    const periodData = chartData.checkInOut[checkInOutPeriod];
    if (!periodData) return null;

    return {
      labels: periodData.labels,
      datasets: [
        {
          label: 'Check-ins',
          data: periodData.checkIns,
          borderColor: '#22c55e',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#22c55e',
          borderWidth: 2,
        },
        {
          label: 'Check-outs',
          data: periodData.checkOuts,
          borderColor: '#ef4444',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.4)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#ef4444',
          borderWidth: 2,
        },
        {
          label: 'Cancelled',
          data: periodData.cancelled,
          borderColor: '#f97316',
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(249, 115, 22, 0.4)');
            gradient.addColorStop(1, 'rgba(249, 115, 22, 0.0)');
            return gradient;
          },
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: '#f97316',
          borderWidth: 2,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          font: { family: 'Inter', size: 11, weight: 500 },
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
          color: '#6b7280'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#111827',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        titleFont: { family: 'Inter', size: 13, weight: 600 },
        bodyFont: { family: 'Inter', size: 12 },
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.chart.canvas.id === 'incomeChart') {
                label += '₱' + context.parsed.y.toLocaleString();
              } else {
                label += context.parsed.y;
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#9ca3af'
        },
        border: { display: false }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6',
          drawBorder: false,
        },
        ticks: {
          font: { family: 'Inter', size: 11 },
          color: '#9ca3af',
          padding: 10,
          callback: function (value) {
            if (value > 100) return '₱' + formatYAxisLabel(value);
            return value;
          }
        },
        border: { display: false }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8 animate-fade-in">
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl shadow-sm animate-fade-in">
          <p className="font-medium flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">{user.name.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening in your dormitory today.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="btn-secondary flex items-center gap-2 self-start md:self-auto shadow-sm hover:shadow-md transition-all"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="card p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-xl bg-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full opacity-50 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">Occupancy Rate</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.occupancyRate}%</h3>
              <p className="text-xs text-gray-400 mt-1">{stats.fullyOccupiedRooms} of {stats.totalRooms} rooms full</p>
            </div>
            <div className={`p-3 rounded-2xl ${stats.occupancyRate > 90 ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'} shadow-sm`}>
              <HomeModernIcon className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-1.5 rounded-full transition-all duration-1000 ${stats.occupancyRate > 90 ? 'bg-red-500' : 'bg-primary-500'}`}
              style={{ width: `${stats.occupancyRate}%` }}
            ></div>
          </div>
        </div>

        <div className="card p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-xl bg-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-secondary-100 to-secondary-200 rounded-full opacity-50 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Occupants</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.activeAssignments}</h3>
              <p className="text-xs text-gray-400 mt-1">Currently checked in</p>
            </div>
            <div className="p-3 rounded-2xl bg-secondary-50 text-secondary-600 shadow-sm">
              <UserGroupIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-xl bg-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full opacity-50 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">Available Rooms</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.availableRooms}</h3>
              <p className="text-xs text-gray-400 mt-1">Ready for booking</p>
            </div>
            <div className="p-3 rounded-2xl bg-green-50 text-green-600 shadow-sm">
              <KeyIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-xl bg-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-full opacity-50 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Requests</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingAssignments}</h3>
              <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
            </div>
            <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-600 shadow-sm">
              <ClockIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 border border-gray-100 shadow-sm hover:shadow-xl bg-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full opacity-50 blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-medium text-gray-500">Cancelled</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{stats.cancelledAssignments}</h3>
              <p className="text-xs text-gray-400 mt-1">Cancelled bookings</p>
            </div>
            <div className="p-3 rounded-2xl bg-orange-50 text-orange-600 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 border border-gray-100 shadow-sm bg-white rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary-50 rounded-xl text-primary-600">
                <ChartBarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-display">Income Overview</h3>
                <p className="text-xs text-gray-500">Revenue analytics</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {incomePeriod === 'monthly' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIncomeMonthOffset(incomeMonthOffset - 1)}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:shadow-sm transition-all"
                    title="Previous month"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIncomeMonthOffset(incomeMonthOffset + 1)}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={incomeMonthOffset >= 0}
                    title="Next month"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                {['monthly', 'yearly'].map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setIncomePeriod(period);
                      if (period === 'yearly') {
                        setIncomeMonthOffset(0);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 capitalize ${incomePeriod === period
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {chartData.income && (
            <div className="mb-6">
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-700">
                  {incomePeriod === 'monthly' && chartData.income.monthlyData?.label}
                  {incomePeriod === 'yearly' && chartData.income.yearlyData?.label}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-100">
                  <p className="text-xs font-medium text-primary-600 mb-1">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary-900">
                    ₱{(incomePeriod === 'monthly' ? chartData.income.monthlyData?.total : chartData.income.yearlyData?.total)?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="h-80">
            {getIncomeChartData() && (
              <Bar id="incomeChart" data={getIncomeChartData()} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="card p-6 border border-gray-100 shadow-sm bg-white rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-secondary-50 rounded-xl text-secondary-600">
                <CalendarDaysIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-display">Check-in Activity</h3>
                <p className="text-xs text-gray-500">Occupancy trends</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              {checkInOutPeriod === 'monthly' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setCheckInOutMonthOffset(checkInOutMonthOffset - 1)}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:shadow-sm transition-all"
                    title="Previous month"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCheckInOutMonthOffset(checkInOutMonthOffset + 1)}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={checkInOutMonthOffset >= 0}
                    title="Next month"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                {['monthly', 'yearly'].map((period) => (
                  <button
                    key={period}
                    onClick={() => {
                      setCheckInOutPeriod(period);
                      if (period === 'yearly') {
                        setCheckInOutMonthOffset(0);
                      }
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 capitalize ${checkInOutPeriod === period
                      ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {chartData.checkInOut && (
            <div className="mb-6">
              <div className="text-center mb-4">
                <p className="text-sm font-medium text-gray-700">
                  {checkInOutPeriod === 'monthly' && chartData.checkInOut.monthly?.label}
                  {checkInOutPeriod === 'yearly' && chartData.checkInOut.yearly?.label}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-100">
                  <p className="text-xs font-medium text-green-600 mb-1">Total Check-ins</p>
                  <p className="text-2xl font-bold text-green-900">
                    {(checkInOutPeriod === 'monthly' ? chartData.checkInOut.monthly?.totalCheckIns : chartData.checkInOut.yearly?.totalCheckIns) || '0'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-4 border border-red-100">
                  <p className="text-xs font-medium text-red-600 mb-1">Total Check-outs</p>
                  <p className="text-2xl font-bold text-red-900">
                    {(checkInOutPeriod === 'monthly' ? chartData.checkInOut.monthly?.totalCheckOuts : chartData.checkInOut.yearly?.totalCheckOuts) || '0'}
                  </p>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-100">
                  <p className="text-xs font-medium text-orange-600 mb-1">Total Cancelled</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {(checkInOutPeriod === 'monthly' ? chartData.checkInOut.monthly?.totalCancelled : chartData.checkInOut.yearly?.totalCancelled) || '0'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <div className="h-80">
            {getCheckInOutChartData() && (
              <Line data={getCheckInOutChartData()} options={chartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="card overflow-hidden border border-gray-100 shadow-sm bg-white rounded-2xl">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-50 rounded-xl text-gray-600">
              <ClockIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 font-display">Recent Activity</h3>
              <p className="text-xs text-gray-500">Latest check-ins and check-outs</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search records..."
                value={historySearchQuery}
                onChange={handleHistorySearchChange}
                className="pl-10 pr-4 py-2 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent w-full sm:w-64 transition-all"
              />
            </div>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              {['all', 'active', 'completed', 'cancelled'].map((type) => (
                <button
                  key={type}
                  onClick={() => setHistoryFilterType(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 capitalize ${historyFilterType === type
                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  {type === 'completed' ? 'History' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Reference #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Room</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-in Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-out Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {getHistoryPaginatedData().data.length > 0 ? (
                getHistoryPaginatedData().data.map((assignment) => {
                  const checkInDate = assignment.checkInTime || assignment.approvalTime;
                  const checkOutDate = assignment.checkOutTime;
                  const duration = checkOutDate && checkInDate
                    ? Math.floor((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)) + ' days'
                    : 'Ongoing';

                  return (
                    <tr key={assignment._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-100 font-mono">
                          {assignment.referenceNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm mr-3 shadow-sm group-hover:scale-110 transition-transform">
                            {assignment.requestedBy?.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{assignment.requestedBy?.name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{assignment.requestedBy?.userId || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {assignment.requestedBy?.mobileNumber || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 group-hover:border-gray-300 transition-colors">
                          Room {assignment.room?.number || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${(assignment.status === 'active' || assignment.status === 'approved')
                          ? 'bg-green-50 text-green-700 border-green-100'
                          : assignment.status === 'completed'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : assignment.status === 'rejected'
                              ? 'bg-red-50 text-red-700 border-red-100'
                              : assignment.status === 'cancelled'
                                ? 'bg-orange-50 text-orange-700 border-orange-100'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                          }`}>
                          {(assignment.status === 'active' || assignment.status === 'approved') ? 'Checked In' : assignment.status === 'completed' ? 'Checked Out' : assignment.status === 'rejected' ? 'Rejected' : assignment.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {assignment.status === 'rejected' || assignment.status === 'cancelled' ? (
                          <span className="text-xs text-gray-400 italic">N/A</span>
                        ) : (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{formatDateTime(checkInDate).split(',')[0]}</span>
                            <span className="text-xs text-gray-400">{formatDateTime(checkInDate).split(',')[1]}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {assignment.status === 'rejected' || assignment.status === 'cancelled' ? (
                          <span className="text-xs text-gray-400 italic">N/A</span>
                        ) : checkOutDate ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{formatDateTime(checkOutDate).split(',')[0]}</span>
                            <span className="text-xs text-gray-400">{formatDateTime(checkOutDate).split(',')[1]}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not checked out</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-medium">
                        {assignment.status === 'rejected' || assignment.status === 'cancelled' ? (
                          <span className="text-xs text-gray-400 italic">N/A</span>
                        ) : (
                          duration
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="p-4 bg-gray-50 rounded-full mb-3">
                        <MagnifyingGlassIcon className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="font-medium text-gray-900">No records found</p>
                      <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 p-4">
          {getHistoryPaginatedData().data.length > 0 ? (
            getHistoryPaginatedData().data.map((assignment) => {
              const checkInDate = assignment.checkInTime || assignment.approvalTime;
              const checkOutDate = assignment.checkOutTime;
              const duration = checkOutDate && checkInDate
                ? Math.floor((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)) + ' days'
                : 'Ongoing';

              return (
                <div key={assignment._id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reference #</span>
                      <p className="font-mono text-sm font-bold text-primary-600">{assignment.referenceNumber || 'N/A'}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${(assignment.status === 'active' || assignment.status === 'approved')
                      ? 'bg-green-50 text-green-700 border-green-100'
                      : assignment.status === 'completed'
                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                        : assignment.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : assignment.status === 'cancelled'
                            ? 'bg-orange-50 text-orange-700 border-orange-100'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                      }`}>
                      {(assignment.status === 'active' || assignment.status === 'approved') ? 'Checked In' : assignment.status === 'completed' ? 'Checked Out' : assignment.status === 'rejected' ? 'Rejected' : assignment.status === 'cancelled' ? 'Cancelled' : 'Pending'}
                    </span>
                  </div>

                  <div className="flex items-center mb-4 pb-4 border-b border-gray-100">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-sm mr-3 shadow-sm">
                      {assignment.requestedBy?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{assignment.requestedBy?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{assignment.requestedBy?.userId || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{assignment.requestedBy?.mobileNumber || 'No Mobile'}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Room</span>
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        Room {assignment.room?.number || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Duration</span>
                      <span className="text-sm font-medium text-gray-900">
                        {assignment.status === 'rejected' || assignment.status === 'cancelled' ? 'N/A' : duration}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Check-in</span>
                      {assignment.status === 'rejected' || assignment.status === 'cancelled' ? (
                        <span className="text-xs text-gray-400 italic">N/A</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-gray-900">{formatDateTime(checkInDate).split(',')[0]}</span>
                          <span className="text-xs text-gray-400">{formatDateTime(checkInDate).split(',')[1]}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block mb-1">Check-out</span>
                      {assignment.status === 'rejected' || assignment.status === 'cancelled' ? (
                        <span className="text-xs text-gray-400 italic">N/A</span>
                      ) : checkOutDate ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-gray-900">{formatDateTime(checkOutDate).split(',')[0]}</span>
                          <span className="text-xs text-gray-400">{formatDateTime(checkOutDate).split(',')[1]}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Not checked out</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100">
              <div className="p-3 bg-white rounded-full inline-block mb-3 shadow-sm">
                <MagnifyingGlassIcon className="w-6 h-6 text-gray-400" />
              </div>
              <p className="font-medium text-gray-900">No records found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
          <p className="text-sm text-gray-500">
            Page <span className="font-medium text-gray-900">{getHistoryPaginatedData().currentPage}</span> of <span className="font-medium text-gray-900">{getHistoryPaginatedData().totalPages || 1}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleHistoryPreviousPage}
              disabled={historyCurrentPage === 1}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleHistoryNextPage}
              disabled={historyCurrentPage >= getHistoryPaginatedData().totalPages}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
