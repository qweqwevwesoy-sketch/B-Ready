import { NextRequest, NextResponse } from 'next/server';

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

    // For now, we'll just return success since the AnonymousChatBox handles localStorage
    // In a production environment, you might want to store this in a database
    // or send it to a backend service for processing

    console.log('✅ Anonymous report created:', reportData.id);

    return NextResponse.json({
      success: true,
      report: reportData,
      message: 'Anonymous report submitted successfully'
    });
  } catch (error) {
    console.error('❌ Error creating anonymous report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create anonymous report' },
      { status: 500 }
    );
  }
}
