// Test script to verify WebSocket connection and report updates
// Run this with: node test-websocket-connection.js

import io from 'socket.io-client';

// Replace with your actual WebSocket URL
const socketUrl = 'https://b-ready.onrender.com:10000';

console.log('📡 Testing WebSocket connection to:', socketUrl);

const socket = io(socketUrl, {
  transports: ['websocket', 'polling'],
  timeout: 10000
});

// Test connection
socket.on('connect', () => {
  console.log('✅ WebSocket connected successfully');
  console.log('📡 Socket ID:', socket.id);

  // Test authentication
  console.log('🔐 Testing authentication...');
  socket.emit('authenticate', {
    email: 'test@example.com',
    userId: 'test-user-123',
    role: 'resident'
  });

  // Test report submission
  setTimeout(() => {
    console.log('📝 Testing report submission...');
    socket.emit('submit_report', {
      type: 'Test Emergency',
      description: 'This is a test report',
      location: { lat: 14.5995, lng: 120.9842 },
      address: 'Test Address',
      timestamp: new Date().toISOString(),
      userId: 'test-user-123',
      userName: 'Test User',
      severity: 'medium',
      status: 'pending'
    });
  }, 2000);

  // Listen for reports updates
  socket.on('reports_update', (data) => {
    console.log('📡 Received reports update:', {
      reportCount: data.reports?.length || 0,
      reports: data.reports?.slice(0, 2) // Show first 2 reports
    });
  });

  socket.on('new_report', (data) => {
    console.log('🆕 Received new report:', data.report);
  });

  socket.on('report_updated', (data) => {
    console.log('🔄 Received report update:', data.report);
  });

  socket.on('auth_success', (data) => {
    console.log('✅ Authentication successful:', data);
  });

  socket.on('report_submitted', (data) => {
    console.log('✅ Report submitted successfully:', data);
  });

  // Test error handling
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
  });

});

socket.on('connect_error', (error) => {
  console.error('❌ Failed to connect:', error);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

// Clean up after 10 seconds
setTimeout(() => {
  console.log('🛑 Closing connection after test');
  socket.disconnect();
  process.exit(0);
}, 10000);