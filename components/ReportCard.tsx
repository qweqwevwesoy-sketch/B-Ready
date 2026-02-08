'use client';

import { formatDate, reverseGeocode } from '@/lib/utils';
import type { Report } from '@/types';
import { useEffect, useState } from 'react';

interface ReportCardProps {
  report: Report;
  onOpenChat?: (reportId: string) => void;
  onApprove?: (reportId: string) => void;
  onReject?: (reportId: string) => void;
  canOpenChat?: boolean;
  showActions?: boolean;
}

export function ReportCard({
  report,
  onOpenChat,
  onApprove,
  onReject,
  canOpenChat = false,
  showActions = false,
}: ReportCardProps) {
  // Initialize state with address from report directly
  const [formattedAddress, setFormattedAddress] = useState<string>(() => {
    if (report.address) {
      return report.address;
    } else if (report.location) {
      return 'Location not specified'; // We'll update this with reverse geocode
    } else {
      return 'Location not specified';
    }
  });

  useEffect(() => {
    // If report has coordinates but no address, reverse geocode to get human-readable address
    if (report.location && !report.address) {
      reverseGeocode(report.location.lat, report.location.lng)
        .then(address => {
          // Only update if we got a proper address (not just coordinates)
          if (address && !address.includes('Coordinates:')) {
            setFormattedAddress(address);
          } else {
            setFormattedAddress('Location not specified');
          }
        })
        .catch(() => {
          setFormattedAddress('Location not specified');
        });
    } else if (report.address && formattedAddress !== report.address) {
      // Use setTimeout to defer state update
      const timer = setTimeout(() => {
        setFormattedAddress(report.address);
      }, 0);
      return () => clearTimeout(timer);
    } else if (!report.address && !report.location && formattedAddress !== 'Location not specified') {
      const timer = setTimeout(() => {
        setFormattedAddress('Location not specified');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [report, formattedAddress]);
  const getStatusBadge = () => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      current: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
      pending: 'Pending',
      approved: 'Approved'  ,
      current: 'Active',
      rejected: 'Rejected',
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClasses[report.status]}`}
      >
        {statusLabels[report.status]}
      </span>
    );
  };

  const handleClick = () => {
    if (canOpenChat && onOpenChat && report?.id) {
      try {
        onOpenChat(report.id);
      } catch (error) {
        console.error('Error handling report card click:', error);
      }
    }
  };

  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 ${
        canOpenChat ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl flex-shrink-0">{report.icon || '🚨'}</div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg truncate">{report.type || 'Emergency Report'}</h3>
            {getStatusBadge()}
          </div>
<p className="text-gray-600 text-sm mb-2">
            Location 📍 {formattedAddress}
          </p>
          <p className="text-gray-500 text-xs mb-3">
            {report.isAnonymous ? 'Anonymous' : (report.userName || 'Resident')}
          </p>
          {!report.isAnonymous && report.userPhone && (
            <p className="text-gray-500 text-xs mb-3">📞 {report.userPhone}</p>
          )}
          
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>📅 {formatDate(report.timestamp)}</span>
            {report.category && (
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                report.category === 'Earthquake' || report.category === 'Landslide' || report.category === 'Volcano' 
                  ? 'bg-orange-100 text-orange-800' 
                  : report.category === 'Fire' || report.category === 'Explosion' 
                  ? 'bg-red-100 text-red-800' 
                  : report.category === 'Flood' || report.category === 'Storm' || report.category === 'Tsunami'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {report.category}
              </span>
            )}
          </div>

          {showActions && report.status === 'pending' && !report.id.startsWith('temp_') && (
            <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
              {onApprove && (
                <button
                  onClick={() => onApprove(report.id)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
                >
                  Approve
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => onReject(report.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
                >
                  Reject
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
