'use client';

import { formatDate } from '@/lib/utils';
import type { Report } from '@/types';

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
  const getStatusBadge = () => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      current: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
      pending: 'Pending',
      approved: 'Approved',
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
    if (canOpenChat && onOpenChat) {
      onOpenChat(report.id);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-200 ${
        canOpenChat ? 'cursor-pointer' : ''
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
          <p className="text-gray-600 text-sm mb-2">{report.address || 'Location not specified'}</p>
          <p className="text-gray-500 text-xs mb-3">{report.userName || 'Resident'}</p>
          {report.phoneNumber && (
            <p className="text-gray-500 text-xs mb-2">📞 {report.phoneNumber}</p>
          )}
          
          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
            <span>📅 {formatDate(report.timestamp)}</span>
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
