import { NextRequest, NextResponse } from 'next/server';
import { Server as ServerIO } from 'socket.io';
import { Server as NetServer } from 'http';

let io: ServerIO | null = null;

// Initialize Socket.IO server
function initSocketIO(httpServer: NetServer) {
  if (io) return io;

  io = new ServerIO(httpServer, {
    path: '/api/socket',
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Store data in memory
  const reports = new Map();
  const messages = new Map();

  io.on('connection', (socket) => {
    console.log('✅ Socket.IO client connected:', socket.id);

    // Send existing reports
    socket.emit('initial_reports', Array.from(reports.values()));

    // Authentication
    socket.on('authenticate', (userData) => {
      console.log('User authenticated:', userData.email);
      socket.emit('auth_success', {
        ...userData,
        message: 'Authentication successful'
      });
    });

    // Submit report
    socket.on('submit_report', (reportData) => {
      console.log('📝 New report:', reportData.type);

      const reportId = reportData.id || `report_${Date.now()}`;
      const fullReport = {
        ...reportData,
        id: reportId,
        status: 'pending',
        timestamp: new Date().toISOString()
      };

      reports.set(reportId, fullReport);
      io?.emit('new_report', fullReport);

      socket.emit('report_submitted', {
        success: true,
        report: fullReport
      });
    });

    // Update report status
    socket.on('update_report', (updateData) => {
      console.log('🔄 Updating report:', updateData.reportId);

      if (reports.has(updateData.reportId)) {
        const existingReport = reports.get(updateData.reportId);
        const updatedReport = {
          ...existingReport,
          status: updateData.status,
          notes: updateData.notes || existingReport.notes,
          updatedAt: new Date().toISOString()
        };

        reports.set(updateData.reportId, updatedReport);
        io?.emit('report_updated', updatedReport);

        console.log('✅ Report updated successfully');
      }
    });

    // Join report chat
    socket.on('join_report_chat', (data) => {
      const { reportId } = data;
      console.log('👥 User joined chat for report:', reportId);

      const reportMessages = messages.get(reportId) || [];
      socket.emit('chat_history', { reportId, messages: reportMessages });
      socket.join(`report_${reportId}`);
    });

    // Chat message
    socket.on('report_chat_message', (messageData) => {
      console.log('💬 New chat message for report:', messageData.reportId);

      const { reportId } = messageData;
      const message = {
        ...messageData,
        timestamp: new Date().toISOString(),
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      if (!messages.has(reportId)) {
        messages.set(reportId, []);
      }
      messages.get(reportId).push(message);

      io?.to(`report_${reportId}`).emit('new_chat_message', message);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO client disconnected:', socket.id);
    });
  });

  return io;
}

// Export the Socket.IO instance for use in the app
export function GET() {
  return NextResponse.json({ message: 'Socket.IO server running' });
}

// This is needed for Next.js to handle WebSocket upgrades
export const dynamic = 'force-dynamic';
