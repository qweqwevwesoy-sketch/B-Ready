import { useState, useEffect } from 'react';

interface ColumnSearchProps {
  placeholder?: string;
  onSearch: (query: string, isDateSearch: boolean, dateRange?: { start: Date | null; end: Date | null }) => void;
  onClear: () => void;
}

export function ColumnSearch({ placeholder = "Search reports...", onSearch, onClear }: ColumnSearchProps) {
  const [query, setQuery] = useState('');
  const [isDateMode, setIsDateMode] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: null,
    end: null
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Debounce search to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isDateMode && dateRange.start) {
        onSearch('', true, dateRange);
      } else if (!isDateMode && query.trim()) {
        onSearch(query.trim(), false);
      } else if (!query.trim()) {
        onSearch('', false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isDateMode, dateRange, onSearch]);

  // Detect if input is numeric (potential date)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Auto-detect numeric input for date mode
    if (value && /^\d/.test(value)) {
      setIsDateMode(true);
      setShowDatePicker(true);
    } else if (!value) {
      setIsDateMode(false);
      setShowDatePicker(false);
      setDateRange({ start: null, end: null });
    } else {
      setIsDateMode(false);
      setShowDatePicker(false);
    }
  };

  const handleDateChange = (field: 'start' | 'end', date: string) => {
    const newDate = date ? new Date(date) : null;
    const newRange = { ...dateRange, [field]: newDate };
    setDateRange(newRange);
    
    if (newDate) {
      onSearch('', true, newRange);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setIsDateMode(false);
    setShowDatePicker(false);
    setDateRange({ start: null, end: null });
    onClear();
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-yellow-500 focus:border-transparent"
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        {isDateMode && (
          <div className="flex gap-2">
            <input
              type="date"
              value={formatDateForInput(dateRange.start)}
              onChange={(e) => handleDateChange('start', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-yellow-500 focus:border-transparent"
            />
            <input
              type="date"
              value={formatDateForInput(dateRange.end)}
              onChange={(e) => handleDateChange('end', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-custom-yellow-500 focus:border-transparent"
            />
          </div>
        )}
      </div>
      
      {isDateMode && (
        <div className="text-xs text-gray-500">
          Date range search active. Enter dates above or clear to search by text.
        </div>
      )}
      
      {query && !isDateMode && (
        <div className="text-xs text-gray-500">
          Searching: {query}
        </div>
      )}
    </div>
  );
}