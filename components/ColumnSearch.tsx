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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);

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
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect if input is numeric (date/time) or text
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Auto-detect if this looks like a date/time input
    if (value.match(/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/) || 
        value.match(/^\d{4}[/\-.]\d{1,2}[/\-.]\d{1,2}$/) ||
        value.match(/^\d{1,2}:\d{2}$/)) {
      setShowDatePicker(true);
    } else if (value === '') {
      setShowDatePicker(false);
    }
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
      setDateInput('');
    }
    setIsFilterOpen(false);
  };

  const handleStatusChange = (status: SearchFilters['status']) => {
    handleFilterChange('status', status);
    setIsFilterOpen(false);
  };

  const formatDateRange = () => {
    if (filters.timePeriod === 'custom' && filters.customDateRange?.start && filters.customDateRange?.end) {
      return `${format(filters.customDateRange.start, 'MMM d, yyyy')} - ${format(filters.customDateRange.end, 'MMM d, yyyy')}`;
    }
    return filters.timePeriod;
  };

  const applyCustomDateRange = () => {
    if (dateInput) {
      try {
        // Parse various date formats
        let startDate: Date, endDate: Date;
        
        if (dateInput.includes(' - ')) {
          // Range format: "2024-01-01 - 2024-01-31"
          const [startStr, endStr] = dateInput.split(' - ');
          startDate = parseISO(startStr);
          endDate = parseISO(endStr);
        } else {
          // Single date: treat as start of day to end of day
          startDate = parseISO(dateInput);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
        }

        handleFilterChange('customDateRange', { start: startDate, end: endDate });
        handleFilterChange('timePeriod', 'custom');
        setShowDatePicker(false);
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
    setDateInput('');
    setShowDatePicker(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 p-2">
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-0"
            onFocus={() => setShowDatePicker(false)}
          />
          
          {/* Date Picker Integration */}
          {showDatePicker && (
            <div 
              ref={datePickerRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="date"
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={applyCustomDateRange}
                  className="px-3 py-1 bg-primary text-white rounded text-sm hover:opacity-90"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-gray-600">
                Enter date in YYYY-MM-DD format or use the date picker
              </p>
            </div>
          )}
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
                  { value: 'approved', label: 'Approved', color: 'bg-green-200' }
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
      
      return searchableText.includes(searchLower);
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