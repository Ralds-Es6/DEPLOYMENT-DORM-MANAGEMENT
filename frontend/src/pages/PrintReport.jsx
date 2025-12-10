import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../api/apiConfig';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import {
  PrinterIcon,
  ArrowPathIcon,
  CalendarIcon,
  XMarkIcon,
  FunnelIcon,
  DocumentChartBarIcon
} from '@heroicons/react/24/outline';

const PrintReport = () => {
  const [transactions, setTransactions] = useState([]);
  const [totalRoomPrice, setTotalRoomPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [printDate, setPrintDate] = useState(new Date());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarType, setCalendarType] = useState('start');
  const [currentPage, setCurrentPage] = useState(1);
  const reportRef = useRef();

  // Pagination constants
  const ROWS_PER_PAGE = 12; // Optimized for A4 landscape printing
  const PAGE_HEIGHT_MM = 277; // A4 landscape usable height in mm
  const MARGIN_MM = 8;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (start = null, end = null) => {
    try {
      setLoading(true);
      setCurrentPage(1);
      const params = {};

      if (start && end) {
        params.startDate = start.toISOString().split('T')[0];
        params.endDate = end.toISOString().split('T')[0];
      }

      const response = await api.get('/assignments/print/transactions', {
        params
      });

      setTransactions(response.data.data);
      setTotalRoomPrice(response.data.totalRoomPrice);
      const recordsText = response.data.data.length === 0 ? 'No records found' : `Loaded ${response.data.data.length} records`;
      toast.success(recordsText);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error(error.message || 'Failed to fetch transaction data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (startDate > endDate) {
      toast.error('Start date must be before end date');
      return;
    }

    fetchTransactions(startDate, endDate);
    setShowCalendar(false);
  };

  const handleResetFilter = () => {
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    fetchTransactions();
    setShowCalendar(false);
  };

  const handleDateSelect = (date) => {
    if (calendarType === 'start') {
      setStartDate(date);
      setCalendarType('end');
    } else {
      if (date < startDate) {
        toast.error('End date must be after start date');
        return;
      }
      setEndDate(date);
      setCalendarType('start');
    }
  };

  // Calculate pagination info
  const calculatePages = () => {
    return Math.ceil(transactions.length / ROWS_PER_PAGE);
  };

  const getPageTransactions = (pageNumber) => {
    const startIdx = (pageNumber - 1) * ROWS_PER_PAGE;
    const endIdx = startIdx + ROWS_PER_PAGE;
    return transactions.slice(startIdx, endIdx);
  };

  const handleDownloadPDF = async () => {
    if (transactions.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      const { default: html2pdf } = await import('html2pdf.js');

      // Create a clean PDF container with all pages
      const pdfContainer = document.createElement('div');
      pdfContainer.style.backgroundColor = 'white';
      pdfContainer.style.color = 'black';
      pdfContainer.style.padding = '0';
      pdfContainer.style.margin = '0';

      // Generate all pages
      Array.from({ length: calculatePages() }).forEach((_, pageIdx) => {
        const pageNumber = pageIdx + 1;
        const pageTransactions = getPageTransactions(pageNumber);
        const totalPages = calculatePages();
        const isFirstPage = pageNumber === 1;
        const isLastPage = pageNumber === totalPages;

        const pageDiv = document.createElement('div');
        pageDiv.style.pageBreakAfter = isLastPage ? 'auto' : 'always';
        pageDiv.style.padding = '8mm';
        pageDiv.style.backgroundColor = 'white';

        // Header
        const headerDiv = document.createElement('div');
        headerDiv.style.textAlign = 'center';
        headerDiv.style.marginBottom = '12px';
        headerDiv.style.paddingBottom = '8px';
        headerDiv.style.borderBottom = '2px solid #000';

        headerDiv.innerHTML = `
          <h2 style="font-size: 14pt; font-weight: bold; margin: 0 0 4px 0;">KARMIN'S DORMITORY</h2>
          <h3 style="font-size: 11pt; font-weight: 600; margin: 0 0 8px 0;">Room Assignment History Report</h3>
          ${isFirstPage && startDate && endDate ? `<p style="font-size: 9pt; margin: 4px 0;">Period: <strong>${formatDate(startDate)}</strong> to <strong>${formatDate(endDate)}</strong></p>` : ''}
          ${isFirstPage ? `<p style="font-size: 8pt; margin: 0;">Generated: ${formatDateTime(printDate)}</p>` : ''}
        `;

        // Table
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.fontSize = '8pt';
        table.style.marginBottom = '8px';

        // Table Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = '#1f2937';
        headerRow.style.color = '#fff';
        const headers = ['User ID', 'Name', 'Room', 'Status', 'Approved', 'Check-in', 'Check-out', 'Days', 'Price'];
        headers.forEach(header => {
          const th = document.createElement('th');
          th.style.border = '1px solid #000';
          th.style.padding = '4px';
          th.style.textAlign = header === 'Price' ? 'right' : 'left';
          th.style.fontWeight = 'bold';
          th.textContent = header;
          headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Table Body
        const tbody = document.createElement('tbody');
        pageTransactions.forEach((transaction, idx) => {
          const row = document.createElement('tr');
          row.style.backgroundColor = idx % 2 === 0 ? '#fff' : '#f3f4f6';

          const cells = [
            transaction.userId,
            transaction.studentName,
            `Rm ${transaction.roomNumber}`,
            transaction.status.includes('Check-in') ? 'IN' : transaction.status.includes('Check-out') ? 'OUT' : 'PENDING',
            transaction.approvalTime ? formatDate(transaction.approvalTime) : '-',
            formatDate(transaction.checkInTime),
            transaction.checkOutTime ? formatDate(transaction.checkOutTime) : '-',
            transaction.duration,
            formatCurrency(transaction.roomPrice)
          ];

          cells.forEach((cell, cellIdx) => {
            const td = document.createElement('td');
            td.style.border = '1px solid #999';
            td.style.padding = '3px 4px';
            td.style.textAlign = cellIdx === cells.length - 1 ? 'right' : (cellIdx === 3 ? 'center' : 'left');
            td.textContent = cell;
            row.appendChild(td);
          });

          tbody.appendChild(row);
        });
        table.appendChild(tbody);

        // Calculate totals for filtered data
        const pageTotal = pageTransactions.reduce((sum, t) => sum + t.roomPrice, 0);

        // Footer
        const footerDiv = document.createElement('div');
        footerDiv.style.borderTop = '2px solid #000';
        footerDiv.style.paddingTop = '8px';
        footerDiv.style.marginTop = '8px';
        footerDiv.style.fontSize = '8pt';

        const summaryDiv = document.createElement('div');
        summaryDiv.style.display = 'grid';
        summaryDiv.style.gridTemplateColumns = '1fr 1fr 1fr';
        summaryDiv.style.gap = '16px';

        const leftCol = document.createElement('div');
        // Only show summary on last page
        if (isLastPage) {
          leftCol.innerHTML = `
            <p style="margin: 0 0 4px 0; font-weight: bold;">SUMMARY</p>
            <p style="margin: 2px 0;">Total Records: ${transactions.length}</p>
            <p style="margin: 2px 0;">Total Revenue: ${formatCurrency(transactions.reduce((sum, t) => sum + t.roomPrice, 0))}</p>
          `;
        } else {
          leftCol.innerHTML = '';
        }

        const centerCol = document.createElement('div');
        centerCol.style.textAlign = 'center';
        centerCol.innerHTML = '<p style="margin: 0; font-size: 7pt;">Official Document</p>';

        const rightCol = document.createElement('div');
        rightCol.style.textAlign = 'right';
        rightCol.innerHTML = `
          <p style="margin: 0 0 12px 0; font-weight: bold;">AUTHORIZED SIGNATURE</p>
          <div style="border-top: 1px solid #000; width: 120px; margin-left: auto; margin-bottom: 4px;"></div>
          <p style="margin: 0; font-size: 7pt;">Administrator</p>
        `;

        summaryDiv.appendChild(leftCol);
        summaryDiv.appendChild(centerCol);
        summaryDiv.appendChild(rightCol);

        footerDiv.appendChild(summaryDiv);

        const footerText = document.createElement('p');
        footerText.style.textAlign = 'center';
        footerText.style.fontSize = '7pt';
        footerText.style.marginTop = '8px';
        footerText.textContent = 'Generated by KARMIN\'S DORMITORY • Confidential';
        footerDiv.appendChild(footerText);

        // Page number in bottom right
        const pageNumberDiv = document.createElement('div');
        pageNumberDiv.style.textAlign = 'right';
        pageNumberDiv.style.fontSize = '7pt';
        pageNumberDiv.style.marginTop = '12px';
        pageNumberDiv.style.color = '#666';
        pageNumberDiv.innerHTML = `Page ${pageNumber} of ${totalPages}`;
        footerDiv.appendChild(pageNumberDiv);

        pageDiv.appendChild(headerDiv);
        pageDiv.appendChild(table);
        pageDiv.appendChild(footerDiv);

        pdfContainer.appendChild(pageDiv);
      });

      const filename = `check-in-checkout-report-${new Date().toISOString().split('T')[0]}.pdf`;
      const options = {
        margin: [6, 8, 6, 8],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          logging: false,
          useCORS: true,
          backgroundColor: '#ffffff',
          allowTaint: true
        },
        jsPDF: {
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        },
        pagebreak: { mode: 'avoid-all' }
      };

      await html2pdf().set(options).from(pdfContainer).save();
      toast.success(`PDF exported successfully (${calculatePages()} page${calculatePages() > 1 ? 's' : ''})`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('Failed to export PDF.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 h-full overflow-y-auto animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header - Screen Only */}
        <div className="print:hidden mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <DocumentChartBarIcon className="w-10 h-10 text-primary-600" />
                Check-in & Check-out Report
              </h1>
              <p className="text-gray-500 mt-1 ml-14">Room Assignment History with Price Details</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDownloadPDF}
                disabled={transactions.length === 0}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PrinterIcon className="w-5 h-5" />
                Download PDF
              </button>
              <button
                onClick={() => fetchTransactions(startDate, endDate)}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Section */}
          <div className="card p-6 bg-white border border-gray-100 shadow-lg shadow-primary-500/5 rounded-2xl mb-6">
            <div className="flex items-center gap-2 mb-4 text-gray-900 font-bold">
              <FunnelIcon className="w-5 h-5 text-primary-600" />
              Filter Options
            </div>

            <div className="flex flex-col md:flex-row items-end gap-4 overflow-x-auto">
              <div className="flex-1 min-w-max md:min-w-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-xl border border-gray-200">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
                    <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      readOnly
                      value={startDate ? formatDate(startDate) : 'Start Date'}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 placeholder-gray-400 cursor-default"
                    />
                  </div>
                  <span className="text-gray-400 font-medium px-1 flex-shrink-0">to</span>
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
                    <CalendarIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      readOnly
                      value={endDate ? formatDate(endDate) : 'End Date'}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 placeholder-gray-400 cursor-default"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${showCalendar ? 'bg-primary-50 text-primary-700 ring-2 ring-primary-500 ring-offset-2' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <CalendarIcon className="w-5 h-5" />
                  {showCalendar ? 'Hide Calendar' : 'Select Dates'}
                </button>

                {(startDate || endDate) && (
                  <button
                    onClick={handleResetFilter}
                    className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Calendar Picker */}
            <div className={`mt-4 overflow-hidden transition-all duration-300 ease-in-out ${showCalendar ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${calendarType === 'start' ? 'bg-primary-500' : 'bg-gray-300'}`}></span>
                      {calendarType === 'start' ? 'Select Start Date' : 'Select End Date'}
                    </p>
                    <Calendar
                      onChange={handleDateSelect}
                      value={calendarType === 'start' ? startDate : endDate}
                      className="rounded-xl border-none shadow-sm !font-sans !w-full"
                      tileClassName={({ date, view }) => {
                        if (view === 'month') {
                          const isSelected = (startDate && date.toDateString() === startDate.toDateString()) ||
                            (endDate && date.toDateString() === endDate.toDateString());
                          const isInRange = startDate && endDate && date > startDate && date < endDate;

                          return `rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors ${isSelected ? '!bg-primary-600 !text-white' : ''} ${isInRange ? '!bg-primary-50 !text-primary-700' : ''}`;
                        }
                      }}
                    />
                  </div>

                  <div className="flex flex-col justify-end gap-3 md:w-48">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-auto">
                      <h4 className="text-blue-800 font-bold text-sm mb-2">Selection Guide</h4>
                      <p className="text-blue-600 text-xs leading-relaxed">
                        1. Select start date<br />
                        2. Select end date<br />
                        3. Click Apply Filter
                      </p>
                    </div>

                    <button
                      onClick={handleApplyFilter}
                      disabled={!startDate || !endDate}
                      className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply Filter
                    </button>
                    <button
                      onClick={() => setShowCalendar(false)}
                      className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="flex justify-center items-center py-12 print:hidden">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Pagination Controls - Screen Only */}
            {transactions.length > 0 && (
              <div className="print:hidden mb-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-bold text-gray-900">{((currentPage - 1) * ROWS_PER_PAGE) + 1}</span> to{' '}
                  <span className="font-bold text-gray-900">{Math.min(currentPage * ROWS_PER_PAGE, transactions.length)}</span> of{' '}
                  <span className="font-bold text-gray-900">{transactions.length}</span> records
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="First Page"
                  >
                    ⟨⟨
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page"
                  >
                    ⟨
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: calculatePages() }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`min-w-10 h-10 rounded-lg font-medium transition-all ${
                          currentPage === idx + 1
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(calculatePages(), currentPage + 1))}
                    disabled={currentPage === calculatePages()}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Next Page"
                  >
                    ⟩
                  </button>
                  <button
                    onClick={() => setCurrentPage(calculatePages())}
                    disabled={currentPage === calculatePages()}
                    className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Last Page"
                  >
                    ⟩⟩
                  </button>
                </div>

                <div className="text-sm font-medium text-gray-700">
                  Page <span className="text-primary-600">{currentPage}</span> of <span className="text-gray-900">{calculatePages()}</span>
                </div>
              </div>
            )}

            <div
              ref={reportRef}
              className="bg-white shadow-xl shadow-gray-200/50 print:shadow-none"
              id="print-report-container"
            >
              {transactions.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 print:border-none">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 print:hidden">
                    <DocumentChartBarIcon className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-lg font-medium">No records found for the selected period</p>
                  <p className="text-gray-400 text-sm mt-1 print:hidden">Try adjusting your date filter</p>
                </div>
              ) : (
                <>
                  {/* Print All Pages - Hidden on screen */}
                  <div className="print:block hidden">
                    {Array.from({ length: calculatePages() }).map((_, pageIdx) => {
                      const pageNumber = pageIdx + 1;
                      const pageTransactions = getPageTransactions(pageNumber);
                      const totalPages = calculatePages();
                      const isFirstPage = pageNumber === 1;
                      const isLastPage = pageNumber === totalPages;

                      return (
                        <div
                          key={pageIdx}
                          className="page-break-container"
                          style={{ pageBreakAfter: isLastPage ? 'auto' : 'always' }}
                        >
                          {/* Page Header */}
                          <div className="text-center mb-3 pb-2 border-b-2 border-gray-800">
                            <h2 className="text-base font-bold text-gray-900 mb-0.5 uppercase tracking-wide">KARMIN'S DORMITORY</h2>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Room Assignment History Report</h3>
                            {isFirstPage && startDate && endDate && (
                              <p className="text-gray-600 text-xs font-medium mt-1 mb-0.5">
                                Period: <span className="font-bold text-gray-900">{formatDate(startDate)}</span> to <span className="font-bold text-gray-900">{formatDate(endDate)}</span>
                              </p>
                            )}
                            {isFirstPage && (
                              <p className="text-gray-500 text-[10px]">Generated: {formatDateTime(printDate)}</p>
                            )}
                            <p className="text-gray-500 text-xs font-medium mt-1">Page {pageNumber} of {totalPages}</p>
                          </div>

                          {/* Table - Professional Document Style */}
                          <table className="w-full text-[10px] border-collapse">
                            <thead>
                              <tr className="bg-gray-800 text-white">
                                <th className="border border-gray-800 px-1 py-1 text-left font-bold whitespace-nowrap">User ID</th>
                                <th className="border border-gray-800 px-1 py-1 text-left font-bold">Name</th>
                                <th className="border border-gray-800 px-1 py-1 text-left font-bold">Mobile</th>
                                <th className="border border-gray-800 px-1 py-1 text-center font-bold whitespace-nowrap">Room</th>
                                <th className="border border-gray-800 px-1 py-1 text-center font-bold whitespace-nowrap">Status</th>
                                <th className="border border-gray-800 px-1 py-1 text-center font-bold whitespace-nowrap">Approved</th>
                                <th className="border border-gray-800 px-1 py-1 text-center font-bold whitespace-nowrap">Check-in</th>
                                <th className="border border-gray-800 px-1 py-1 text-center font-bold whitespace-nowrap">Check-out</th>
                                <th className="border border-gray-800 px-1 py-1 text-center font-bold whitespace-nowrap">Days</th>
                                <th className="border border-gray-800 px-1 py-1 text-right font-bold whitespace-nowrap">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              {pageTransactions.map((transaction, idx) => (
                                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
                                  <td className="border border-gray-400 px-1 py-1 font-bold text-gray-900 whitespace-nowrap">{transaction.userId}</td>
                                  <td className="border border-gray-400 px-1 py-1 text-gray-800 font-medium">{transaction.studentName}</td>
                                  <td className="border border-gray-400 px-1 py-1 text-gray-800 font-medium">{transaction.mobileNumber}</td>
                                  <td className="border border-gray-400 px-1 py-1 text-center font-bold text-gray-900 whitespace-nowrap">Rm {transaction.roomNumber}</td>
                                  <td className="border border-gray-400 px-1 py-1 text-center font-bold whitespace-nowrap">
                                    {transaction.status.includes('Check-in') ? 'IN' : transaction.status.includes('Check-out') ? 'OUT' : 'PENDING'}
                                  </td>
                                  <td className="border border-gray-400 px-1 py-1 text-center text-gray-800 whitespace-nowrap">{transaction.approvalTime ? formatDate(transaction.approvalTime) : '-'}</td>
                                  <td className="border border-gray-400 px-1 py-1 text-center text-gray-800 whitespace-nowrap">{formatDate(transaction.checkInTime)}</td>
                                  <td className="border border-gray-400 px-1 py-1 text-center text-gray-800 whitespace-nowrap">{transaction.checkOutTime ? formatDate(transaction.checkOutTime) : '-'}</td>
                                  <td className="border border-gray-400 px-1 py-1 text-center font-bold text-gray-900 whitespace-nowrap">{transaction.duration}</td>
                                  <td className="border border-gray-400 px-1 py-1 text-right font-bold text-gray-900 whitespace-nowrap">{formatCurrency(transaction.roomPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {/* Page Footer */}
                          <div className="border-t-2 border-gray-800 pt-2 mt-2">
                            <div className="grid grid-cols-3 gap-4 text-[9px]">
                              <div>
                                <p className="text-gray-900 font-bold uppercase mb-0.5">Summary</p>
                                <p className="text-gray-700">Total Records: {transactions.length}</p>
                                <p className="text-gray-700">Total Revenue: {formatCurrency(totalRoomPrice)}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-gray-600 uppercase tracking-widest font-semibold">Official Document</p>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-900 font-bold uppercase mb-1">Authorized Signature</p>
                                <div className="border-t border-gray-400 mb-0.5"></div>
                                <p className="text-gray-700">Administrator</p>
                              </div>
                            </div>
                            <p className="text-center text-gray-600 text-[8px] italic mt-1">
                              Generated by KARMIN'S DORMITORY • Confidential
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Screen View - Current Page Only */}
                  <div className="print:hidden bg-white">
                    {(() => {
                      const pageTransactions = getPageTransactions(currentPage);
                      const totalPages = calculatePages();
                      return (
                        <>
                          {/* Page Header */}
                          <div className="text-center mb-6 pb-4 border-b-2 border-gray-200 px-8 py-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-1 uppercase tracking-wide">KARMIN'S DORMITORY</h2>
                            <h3 className="text-lg font-semibold text-gray-700 uppercase tracking-wider">Room Assignment History Report</h3>
                            {startDate && endDate && (
                              <p className="text-gray-600 text-sm font-medium mt-2 mb-1">
                                Period: <span className="font-bold text-gray-900">{formatDate(startDate)}</span> to <span className="font-bold text-gray-900">{formatDate(endDate)}</span>
                              </p>
                            )}
                            <p className="text-gray-500 text-xs">Generated: {formatDateTime(printDate)}</p>
                          </div>

                          {/* Table - Screen View */}
                          <div className="px-4 md:px-8 py-4">
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                              <table className="w-full text-sm border-collapse bg-white">
                                <thead>
                                  <tr className="bg-gray-100 border-y-2 border-gray-800">
                                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900 uppercase text-xs whitespace-nowrap">User ID</th>
                                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900 uppercase text-xs">Name</th>
                                    <th className="border border-gray-300 px-4 py-3 text-left font-bold text-gray-900 uppercase text-xs">Mobile</th>
                                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 uppercase text-xs whitespace-nowrap">Room</th>
                                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 uppercase text-xs whitespace-nowrap">Status</th>
                                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 uppercase text-xs whitespace-nowrap">Approved</th>
                                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 uppercase text-xs whitespace-nowrap">Check-in</th>
                                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 uppercase text-xs whitespace-nowrap">Check-out</th>
                                    <th className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 uppercase text-xs whitespace-nowrap">Days</th>
                                    <th className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-900 uppercase text-xs whitespace-nowrap">Price</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {pageTransactions.map((transaction, idx) => {
                                    const actualIndex = (currentPage - 1) * ROWS_PER_PAGE + idx;
                                    return (
                                      <tr key={actualIndex} className={actualIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                                        <td className="border border-gray-300 px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{transaction.userId}</td>
                                        <td className="border border-gray-300 px-4 py-3 text-gray-700 font-medium">{transaction.studentName}</td>
                                        <td className="border border-gray-300 px-4 py-3 text-gray-700 font-medium">{transaction.mobileNumber}</td>
                                        <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 whitespace-nowrap">Rm {transaction.roomNumber}</td>
                                        <td className="border border-gray-300 px-4 py-3 text-center whitespace-nowrap">
                                          <span className={`inline-block px-3 py-1 text-xs font-bold uppercase rounded-full ${
                                            transaction.status.includes('Check-in')
                                              ? 'bg-green-100 text-green-800'
                                              : transaction.status.includes('Check-out')
                                              ? 'bg-red-100 text-red-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {transaction.status.includes('Check-in') ? 'In' : transaction.status.includes('Check-out') ? 'Out' : 'Pending'}
                                          </span>
                                        </td>
                                        <td className="border border-gray-300 px-4 py-3 text-center text-gray-700 whitespace-nowrap">{transaction.approvalTime ? formatDate(transaction.approvalTime) : '-'}</td>
                                        <td className="border border-gray-300 px-4 py-3 text-center text-gray-700 whitespace-nowrap">{formatDate(transaction.checkInTime)}</td>
                                        <td className="border border-gray-300 px-4 py-3 text-center text-gray-700 whitespace-nowrap">{transaction.checkOutTime ? formatDate(transaction.checkOutTime) : '-'}</td>
                                        <td className="border border-gray-300 px-4 py-3 text-center font-bold text-gray-900 whitespace-nowrap">{transaction.duration}</td>
                                        <td className="border border-gray-300 px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatCurrency(transaction.roomPrice)}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4">
                              {pageTransactions.map((transaction, idx) => {
                                const actualIndex = (currentPage - 1) * ROWS_PER_PAGE + idx;
                                return (
                                  <div key={actualIndex} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">User ID</span>
                                        <p className="font-bold text-gray-900">{transaction.userId}</p>
                                      </div>
                                      <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full ${
                                        transaction.status.includes('Check-in')
                                          ? 'bg-green-100 text-green-800'
                                          : transaction.status.includes('Check-out')
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {transaction.status.includes('Check-in') ? 'In' : transaction.status.includes('Check-out') ? 'Out' : 'Pending'}
                                      </span>
                                    </div>

                                    <div className="space-y-2">
                                      <div>
                                        <span className="text-xs text-gray-500 block">Name</span>
                                        <p className="font-medium text-gray-900">{transaction.studentName}</p>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <span className="text-xs text-gray-500 block">Room</span>
                                          <p className="font-bold text-gray-900">Rm {transaction.roomNumber}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs text-gray-500 block">Duration</span>
                                          <p className="font-bold text-gray-900">{transaction.duration}</p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-4">
                                         <div>
                                          <span className="text-xs text-gray-500 block">Check-in</span>
                                          <p className="text-sm text-gray-700">{formatDate(transaction.checkInTime)}</p>
                                        </div>
                                        <div>
                                          <span className="text-xs text-gray-500 block">Check-out</span>
                                          <p className="text-sm text-gray-700">{transaction.checkOutTime ? formatDate(transaction.checkOutTime) : '-'}</p>
                                        </div>
                                      </div>
                                       <div>
                                          <span className="text-xs text-gray-500 block">Approved</span>
                                          <p className="text-sm text-gray-700">{transaction.approvalTime ? formatDate(transaction.approvalTime) : '-'}</p>
                                        </div>

                                      <div className="pt-2 mt-2 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Price</span>
                                        <span className="font-bold text-primary-600 text-lg">{formatCurrency(transaction.roomPrice)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="border-t-2 border-gray-200 px-8 py-6 mt-8">
                            <div className="grid grid-cols-3 gap-8">
                              <div>
                                <p className="text-gray-900 font-bold text-sm uppercase mb-2">Summary</p>
                                <p className="text-gray-600 text-sm">Total Records: <span className="font-bold text-gray-900">{transactions.length}</span></p>
                                <p className="text-gray-600 text-sm">Total Revenue: <span className="font-bold text-gray-900">{formatCurrency(totalRoomPrice)}</span></p>
                              </div>
                              <div className="text-center flex flex-col justify-end pb-8">
                                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
                                  Official Document
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-gray-900 font-bold text-sm uppercase mb-6">Authorized Signature</p>
                                <div className="border-t border-gray-400 w-32 ml-auto"></div>
                                <p className="text-gray-500 text-xs mt-2">Administrator</p>
                              </div>
                            </div>
                            <p className="text-center text-gray-400 text-xs italic mt-4">
                              Generated by KARMIN'S DORMITORY • Confidential
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Print & Screen Styles */}
      <style>{`
        @page {
          size: A4 landscape;
          margin: 6mm 8mm;
          padding: 0;
        }

        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          *,
          *::before,
          *::after {
            background: transparent !important;
            color: #000 !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }

          html, body {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }

          /* Hide all page elements */
          html > body > * {
            display: none !important;
            visibility: hidden !important;
          }

          /* Show only the report container */
          #print-report-container {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
          }

          #print-report-container * {
            display: revert !important;
            visibility: visible !important;
          }

          /* Hide interactive elements */
          button, input, select, textarea, .print\\:hidden, nav, aside, .sidebar, [class*="print:hidden"] {
            display: none !important;
            visibility: hidden !important;
          }

          /* Page containers */
          .page-break-container {
            display: block !important;
            visibility: visible !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
            background: white !important;
            orphans: 3;
            widows: 3;
          }

          .page-break-container:last-child {
            page-break-after: auto !important;
          }

          /* Table styling - ensure it prints properly */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            border: 1px solid #000 !important;
            font-size: 9pt !important;
          }

          thead {
            display: table-header-group !important;
            page-break-after: avoid !important;
            background: #1f2937 !important;
            color: #fff !important;
          }

          tbody {
            display: table-row-group !important;
          }

          tbody tr {
            page-break-inside: avoid !important;
            display: table-row !important;
          }

          tbody tr:nth-child(even) {
            background: #f9fafb !important;
          }

          tbody tr:nth-child(odd) {
            background: white !important;
          }

          tfoot {
            display: table-footer-group !important;
            page-break-after: avoid !important;
          }

          th {
            display: table-cell !important;
            border: 1px solid #000 !important;
            padding: 3px 4px !important;
            font-size: 8pt !important;
            font-weight: bold !important;
            background-color: #1f2937 !important;
            color: #fff !important;
            text-align: left !important;
          }

          td {
            display: table-cell !important;
            border: 1px solid #999 !important;
            padding: 3px 4px !important;
            font-size: 9pt !important;
            color: #000 !important;
            background: transparent !important;
            text-align: left !important;
          }

          /* Text alignment */
          .text-right { text-align: right !important; }
          .text-center { text-align: center !important; }
          .text-left { text-align: left !important; }

          /* Borders always black */
          .border, .border-b, .border-t, .border-l, .border-r, .border-y-2 {
            border-color: #000 !important;
            border-style: solid !important;
          }

          /* Text always black */
          h1, h2, h3, h4, h5, h6, p, span, div {
            color: #000 !important;
          }

          /* Background always white or gray */
          .bg-white { background-color: white !important; }
          .bg-gray-50, .bg-gray-100, .bg-gray-200 { background-color: #f3f4f6 !important; }

          /* Remove styles that prevent printing */
          .shadow { box-shadow: none !important; }
          .rounded-lg, .rounded-xl, .rounded-2xl { border-radius: 0 !important; }
          .overflow-x-auto, .overflow-y-auto { overflow: visible !important; }
        }
      `}</style>
    </div>
  );
};

export default PrintReport;
