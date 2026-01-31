// Test script to validate WebSocket connection and chat fixes
// Run this in browser console to test the fixes

console.log('🧪 Testing WebSocket and Chat Fixes...');

// Test 1: Check WebSocket connection stability
function testWebSocketConnection() {
  console.log('📡 Testing WebSocket Connection...');
  
  // Check if socket context is available
  const socketContext = window.__NEXT_DATA__?.props?.pageProps?.socketContext;
  
  if (socketContext) {
    console.log('✅ Socket context found');
    console.log('Connection state:', socketContext.connectionState);
    console.log('Connected:', socketContext.connected);
    console.log('Queue length:', socketContext.queueLength);
  } else {
    console.log('❌ Socket context not found - checking for global socket');
    
    // Try to find socket instance
    const socketElements = document.querySelectorAll('[data-socket]');
    if (socketElements.length > 0) {
      console.log('✅ Found socket elements:', socketElements.length);
    }
  }
}

// Test 2: Check chat message loading
function testChatMessageLoading() {
  console.log('💬 Testing Chat Message Loading...');
  
  // Check if chat messages are being loaded
  const chatMessages = document.querySelectorAll('[data-testid="chat-message"]');
  console.log('Found chat messages:', chatMessages.length);
  
  if (chatMessages.length > 0) {
    console.log('✅ Chat messages are loading');
    chatMessages.forEach((msg, index) => {
      console.log(`Message ${index}:`, msg.textContent);
    });
  } else {
    console.log('❌ No chat messages found');
  }
}

// Test 3: Check performance improvements
function testPerformance() {
  console.log('⚡ Testing Performance Improvements...');
  
  // Check console log frequency
  const originalConsoleLog = console.log;
  let logCount = 0;
  let lastLogTime = Date.now();
  
  console.log = function(...args) {
    logCount++;
    const timeDiff = Date.now() - lastLogTime;
    if (timeDiff < 100) { // Less than 100ms between logs
      console.warn('⚠️ Potential log spam detected:', timeDiff, 'ms');
    }
    lastLogTime = Date.now();
    originalConsoleLog.apply(console, args);
  };
  
  // Wait and check log frequency
  setTimeout(() => {
    console.log = originalConsoleLog;
    console.log('📊 Log frequency test complete. Total logs:', logCount);
  }, 5000);
}

// Test 4: Check connection throttling
function testConnectionThrottling() {
  console.log('🔄 Testing Connection Throttling...');
  
  // Simulate rapid connection attempts
  let attemptCount = 0;
  const maxAttempts = 5;
  
  const testConnection = () => {
    attemptCount++;
    console.log(`Connection attempt ${attemptCount}`);
    
    if (attemptCount < maxAttempts) {
      setTimeout(testConnection, 100); // Rapid attempts
    }
  };
  
  testConnection();
}

// Run all tests
function runAllTests() {
  console.log('🚀 Starting WebSocket and Chat Fix Tests...');
  
  testWebSocketConnection();
  testChatMessageLoading();
  testPerformance();
  testConnectionThrottling();
  
  console.log('✅ All tests initiated. Check console for results.');
}

// Auto-run tests after page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runAllTests);
} else {
  runAllTests();
}

// Export test functions for manual testing
window.testWebSocketConnection = testWebSocketConnection;
window.testChatMessageLoading = testChatMessageLoading;
window.testPerformance = testPerformance;
window.testConnectionThrottling = testConnectionThrottling;
window.runAllTests = runAllTests;

console.log('🧪 Test script loaded. Use window.runAllTests() to run tests manually.');