'use client';

import { useState, useEffect, useRef } from 'react';
import { format, parseISO, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { Report } from '@/types';

interface ColumnSearchProps {
  onSearch: (searchTerm: string, filters: SearchFilters) => void;
  placeholder?: string;
  showStatusFilters?: boolean;
  columnType?: 'approved' | 'current' | 'pending' | 'my-reports';
}

export interface SearchFilters {
  sortBy: 'date-newest' | 'date-oldest' | 'category-asc' | 'category-desc' | 'user-asc' | 'user-desc';
  timePeriod: 'all' | 'this-week' | 'this-month' | 'last-3-months' | 'custom';
  customDateRange?: {
    start: Date | null;
    end: Date | null;
  };
  status?: 'pending' | 'current' | 'approved' | 'all';
}

export function ColumnSearch({ 
  onSearch, 
  placeholder = 'Search reports...', 
  showStatusFilters = false,
  columnType 
}: ColumnSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'date-newest',
    timePeriod: 'all',
    customDateRange: { start: null, end: null },
    status: 'all'
  });
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });
  const filterRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchTerm, filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, filters, onSearch]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
    handleFilterChange('sortBy', sortBy);
    setIsFilterOpen(false);
  };

  const handleTimePeriodChange = (timePeriod: SearchFilters['timePeriod']) => {
    handleFilterChange('timePeriod', timePeriod);
    if (timePeriod !== 'custom') {
      handleFilterChange('customDateRange', { start: null, end: null });
      setCustomDateRange({ start: '', end: '' });
    }
  };

  const handleStatusChange = (status: SearchFilters['status']) => {
    handleFilterChange('status', status);
    setIsFilterOpen(false);
  };

  const handleCustomDateRangeChange = (field: 'start' | 'end', value: string) => {
    setCustomDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyCustomDateRange = () => {
    if (customDateRange.start && customDateRange.end) {
      try {
        const startDate = parseISO(customDateRange.start);
        const endDate = parseISO(customDateRange.end);
        
        handleFilterChange('customDateRange', { start: startDate, end: endDate });
        handleFilterChange('timePeriod', 'custom');
        setIsFilterOpen(false);
      } catch (error) {
        console.error('Invalid date format:', error);
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      sortBy: 'date-newest',
      timePeriod: 'all',
      customDateRange: { start: null, end: null },
      status: 'all'
    });
    setCustomDateRange({ start: '', end: '' });
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-2">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
          title="Filter and sort options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
        </button>

        {/* Clear Filters Button */}
        {(searchTerm || filters.sortBy !== 'date-newest' || filters.timePeriod !== 'all' || filters.status !== 'all') && (
          <button
            onClick={clearFilters}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear all filters"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Dropdown */}
      {isFilterOpen && (
        <div 
          ref={filterRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {/* Sort Options */}
          <div className="p-3 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">Sort By</div>
            <div className="space-y-1">
              {[
                { value: 'date-newest', label: 'Date: Newest First' },
                { value: 'date-oldest', label: 'Date: Oldest First' },
                { value: 'category-asc', label: 'Category: A to Z' },
                { value: 'category-desc', label: 'Category: Z to A' },
                { value: 'user-asc', label: 'User: A to Z' },
                { value: 'user-desc', label: 'User: Z to A' }
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="sortBy"
                    checked={filters.sortBy === option.value}
                    onChange={() => handleSortChange(option.value as SearchFilters['sortBy'])}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Period Options */}
          <div className="p-3 border-b border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">Time Period</div>
            <div className="space-y-1">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'this-week', label: 'This Week' },
                { value: 'this-month', label: 'This Month' },
                { value: 'last-3-months', label: 'Last 3 Months' },
                { value: 'custom', label: 'Custom Range' }
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                  <input
                    type="radio"
                    name="timePeriod"
                    checked={filters.timePeriod === option.value}
                    onChange={() => handleTimePeriodChange(option.value as SearchFilters['timePeriod'])}
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            
            {/* Inline Date Picker for Custom Range */}
            {filters.timePeriod === 'custom' && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-700 mb-2">Select Date Range</div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customDateRange.start}
                      onChange={(e) => handleCustomDateRangeChange('start', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customDateRange.end}
                      onChange={(e) => handleCustomDateRangeChange('end', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={applyCustomDateRange}
                    className="flex-1 px-3 py-1 bg-primary text-white rounded text-sm hover:opacity-90"
                    disabled={!customDateRange.start || !customDateRange.end}
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setCustomDateRange({ start: '', end: '' });
                      handleTimePeriodChange('all');
                    }}
                    className="flex-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Filters (for status update page) */}
          {showStatusFilters && (
            <div className="p-3">
              <div className="text-xs font-semibold text-gray-700 mb-2">Status</div>
              <div className="space-y-1">
                {[
                  { value: 'all', label: 'All Statuses', color: 'bg-gray-200' },
                  { value: 'pending', label: 'Pending', color: 'bg-yellow-200' },
                  { value: 'current', label: 'Current', color: 'bg-blue-200' },
                  { value: 'approved', label: 'Completed', color: 'bg-green-200' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={filters.status === option.value}
                      onChange={() => handleStatusChange(option.value as SearchFilters['status'])}
                      className="text-primary focus:ring-primary"
                    />
                    <span className={`w-3 h-3 rounded-full ${option.color}`}></span>
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Utility function to check if search term matches report date/time
function checkDateSearch(report: Report, searchTerm: string): boolean {
  if (!report.timestamp) return false;
  
  const reportDate = new Date(report.timestamp);
  const searchLower = searchTerm.toLowerCase();
  
  // Format date in various ways to match user input
  const dateFormats = [
    // Full date formats
    format(reportDate, 'yyyy-MM-dd'),      // 2024-01-15
    format(reportDate, 'MM/dd/yyyy'),      // 01/15/2024
    format(reportDate, 'dd/MM/yyyy'),      // 15/01/2024
    format(reportDate, 'MMM dd, yyyy'),    // Jan 15, 2024
    format(reportDate, 'MMMM dd, yyyy'),   // January 15, 2024
    
    // Date without year
    format(reportDate, 'MM/dd'),           // 01/15
    format(reportDate, 'dd/MM'),           // 15/01
    format(reportDate, 'MMM dd'),          // Jan 15
    format(reportDate, 'MMMM dd'),         // January 15
    
    // Time formats
    format(reportDate, 'HH:mm'),           // 14:30
    format(reportDate, 'hh:mm a'),         // 2:30 PM
    format(reportDate, 'HH:mm:ss'),        // 14:30:45
    format(reportDate, 'hh:mm:ss a'),      // 2:30:45 PM
    
    // Combined date and time
    format(reportDate, 'yyyy-MM-dd HH:mm'),    // 2024-01-15 14:30
    format(reportDate, 'MM/dd/yyyy HH:mm'),    // 01/15/2024 14:30
    format(reportDate, 'dd/MM/yyyy HH:mm'),    // 15/01/2024 14:30
    format(reportDate, 'MMM dd, yyyy HH:mm'),  // Jan 15, 2024 14:30
  ];
  
  // Check if search term matches any of the date formats
  return dateFormats.some(format => format.toLowerCase().includes(searchLower));
}

// Utility function to filter and sort reports
export function filterReports(reports: Report[], searchTerm: string, filters: SearchFilters) {
  let filtered = [...reports];

  // Text search
  if (searchTerm.trim()) {
    const searchLower = searchTerm.toLowerCase();
    filtered = filtered.filter(report => {
      const searchableText = [
        report.type,
        report.category,
        report.userName,
        report.address,
        report.description
      ].filter(Boolean).join(' ').toLowerCase();
      
      // Check if search term matches any text field
      const textMatches = searchableText.includes(searchLower);
      
      // Check if search term matches date/time
      const dateMatches = checkDateSearch(report, searchTerm);
      
      return textMatches || dateMatches;
    });
  }

  // Date filtering
  if (filters.timePeriod !== 'all') {
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (filters.timePeriod) {
      case 'this-week':
        startDate = startOfWeek(now, { weekStartsOn: 0 });
        endDate = endOfWeek(now, { weekStartsOn: 0 });
        break;
      case 'this-month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last-3-months':
        startDate = subMonths(now, 3);
        endDate = now;
        break;
      case 'custom':
        if (filters.customDateRange?.start && filters.customDateRange?.end) {
          startDate = filters.customDateRange.start;
          endDate = filters.customDateRange.end;
        } else {
          startDate = new Date(0);
          endDate = now;
        }
        break;
      default:
        startDate = new Date(0);
        endDate = now;
    }

    filtered = filtered.filter(report => {
      const reportDate = report.timestamp ? new Date(report.timestamp) : new Date();
      return isWithinInterval(reportDate, { start: startDate, end: endDate });
    });
  }

  // Status filtering (for status update page)
  if (filters.status !== 'all') {
    filtered = filtered.filter(report => report.status === filters.status);
  }

  // Sorting
  filtered.sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
    const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);

    switch (filters.sortBy) {
      case 'date-newest':
        return dateB.getTime() - dateA.getTime();
      case 'date-oldest':
        return dateA.getTime() - dateB.getTime();
      case 'category-asc':
        return (a.category || '').localeCompare(b.category || '');
      case 'category-desc':
        return (b.category || '').localeCompare(a.category || '');
      case 'user-asc':
        return (a.userName || '').localeCompare(b.userName || '');
      case 'user-desc':
        return (b.userName || '').localeCompare(a.userName || '');
      default:
        return 0;
    }
  });

  return filtered;
}