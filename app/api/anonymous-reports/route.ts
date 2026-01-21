import { NextRequest, NextResponse } from 'next/server';
import { storeOfflineReport } from '@/lib/offline-manager';
import { offlineService } from '@/lib/offline-service';

console.log('🚀 Anonymous Reports API route loaded');

// POST /api/anonymous-reports - Create anonymous report
export async function POST(request: NextRequest) {
  console.log('📡 POST /api/anonymous-reports called');

  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    // Create anonymous report data
    const reportData = {
      id: `anonymous_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'Anonymous Report',
      description: message.trim(),
      location: null,
      address: 'Anonymous location',
      timestamp: new Date().toISOString(),
      userId: 'anonymous',
      userName: 'Anonymous User',
      severity: 'medium' as const,
      status: 'pending' as const,
      category: 'Anonymous',
      subcategory: 'General',
      icon: '🚨',
    };

    // Check if we're offline or should use local backend
    const isOffline = !navigator.onLine || offlineService.shouldUseLocalBackend();

    if (isOffline) {
      console.log('📱 Offline mode detected, storing report locally');

      // Store offline report using the offline manager
      const offlineReport = storeOfflineReport(reportData);

      console.log('✅ Anonymous report stored offline:', offlineReport.offlineId);

      return NextResponse.json({
        success: true,
        report: offlineReport,
        message: 'Anonymous report stored offline and will sync when connection is restored',
        offline: true
      });
    } else {
      // Online mode - try to submit to backend service
      console.log('🌐 Online mode, attempting to submit report');

      try {
        const result = await offlineService.createReport(reportData);

        if (result.success) {
          console.log('✅ Anonymous report submitted to backend:', result.id);
          return NextResponse.json({
            success: true,
            report: reportData,
            message: 'Anonymous report submitted successfully'
          });
        } else {
          console.warn('⚠️ Backend submission failed, falling back to offline storage');
          // Fall back to offline storage
          const offlineReport = storeOfflineReport(reportData);
          return NextResponse.json({
            success: true,
            report: offlineReport,
            message: 'Report stored locally due to backend issues',
            offline: true
          });
        }
      } catch (backendError) {
        console.error('❌ Backend submission error:', backendError);
        // Fall back to offline storage
        const offlineReport = storeOfflineReport(reportData);
        return NextResponse.json({
          success: true,
          report: offlineReport,
          message: 'Report stored locally due to connection issues',
          offline: true
        });
      }
    }
  } catch (error) {
    console.error('❌ Error creating anonymous report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create anonymous report' },
      { status: 500 }
    );
  }
}
