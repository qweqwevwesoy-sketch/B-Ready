// server/server.js - WITH FIREBASE PERSISTENCE
import dotenv from 'dotenv';
import express from 'express';
import https from 'https';
import http from 'http';
import socketIo from 'socket.io';
import cors from 'cors';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Check if we're using local backend (offline mode)
const useLocalBackend = process.env.USE_LOCAL_BACKEND === 'true';

let db = null;

// Initialize Firebase Admin only if not in offline mode
if (!useLocalBackend) {
  try {
    // Check if all required Firebase Admin environment variables are set
    const requiredEnvVars = [
      'FIREBASE_PROJECT_ID',
      'FIREBASE_PRIVATE_KEY_ID', 
      'FIREBASE_PRIVATE_KEY',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_CLIENT_ID',
      'FIREBASE_CLIENT_X509_CERT_URL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️ Missing Firebase Admin environment variables:', missingVars);
      console.log('📱 Server will run without Firebase persistence (offline mode)');
      console.log('📝 To enable Firebase persistence, set these environment variables:');
      missingVars.forEach(varName => console.log(`   - ${varName}`));
      useLocalBackend = true; // Force offline mode
    } else {
      // Try to initialize Firebase Admin
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      db = admin.firestore();
      console.log('✅ Firebase Admin initialized successfully');
      console.log(`📊 Connected to Firestore project: ${process.env.FIREBASE_PROJECT_ID}`);
    }
  } catch (firebaseError) {
    console.error('❌ Firebase Admin initialization failed:', firebaseError.message);
    console.log('📱 Server will run without Firebase persistence (offline mode)');
    console.log('🔧 Check your Firebase service account configuration');
    useLocalBackend = true; // Force offline mode
  }
} else {
  console.log('📱 Offline mode enabled - skipping Firebase initialization');
}

const app = express();

// const sslOptions = {
//   key: fs.readFileSync(path.join(__dirname, '120.72.20.15+2-key.pem')),
//   cert: fs.readFileSync(path.join(__dirname, '120.72.20.15+2.pem'))
// };

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://192.168.0.111:3000",
      "http://192.168.50.250:3000",
      "https://192.168.0.111:3000",
      "https://192.168.50.250:3000",
      "https://localhost:3000",
      "https://120.72.20.15:3000"
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type"]
  }
});

// Store data in memory for active session, but persist to Firebase
const users = new Map();
const reports = new Map();
const messages = new Map();
const stations = new Map();

// Load reports from Firebase on startup
async function loadReportsFromFirebase() {
  try {
    const reportsRef = db.collection('reports');
    const snapshot = await reportsRef.get();
    snapshot.forEach(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps back to ISO strings
      const report = {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
      };
      reports.set(doc.id, report);
    });
    console.log(`📋 Loaded ${reports.size} reports from Firebase`);
  } catch (error) {
    console.error('❌ Error loading reports from Firebase:', error);
  }
}

// Save report to Firebase
async function saveReportToFirebase(report) {
  try {
    const reportRef = db.collection('reports').doc(report.id);
    await reportRef.set({
      ...report,
      timestamp: admin.firestore.Timestamp.fromDate(new Date(report.timestamp))
    });
    console.log('💾 Report saved to Firebase:', report.id);
  } catch (error) {
    console.error('❌ Error saving report to Firebase:', error);
  }
}

// Load messages from Firebase
async function loadMessagesFromFirebase() {
  try {
    const messagesRef = db.collection('messages');
    const snapshot = await messagesRef.get();
    snapshot.forEach(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps back to ISO strings
      const message = {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp
      };
      if (!messages.has(message.reportId)) {
        messages.set(message.reportId, []);
      }
      messages.get(message.reportId).push(message);
    });
    console.log(`💬 Loaded messages from Firebase`);
  } catch (error) {
    console.error('❌ Error loading messages from Firebase:', error);
  }
}

// Save message to Firebase
async function saveMessageToFirebase(message) {
  try {
    const messageRef = db.collection('messages').doc();
    await messageRef.set({
      ...message,
      timestamp: admin.firestore.Timestamp.fromDate(new Date(message.timestamp))
    });
    console.log('💾 Message saved to Firebase:', message.reportId);
  } catch (error) {
    console.error('❌ Error saving message to Firebase:', error);
  }
}

// Load stations from Firebase
async function loadStationsFromFirebase() {
  try {
    const stationsRef = db.collection('stations');
    const snapshot = await stationsRef.get();
    snapshot.forEach(doc => {
      const data = doc.data();
      // Convert Firestore Timestamps back to ISO strings
      const station = {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || data.created_at,
        updated_at: data.updated_at?.toDate?.()?.toISOString() || data.updated_at
      };
      stations.set(doc.id, station);
    });
    console.log(`📍 Loaded ${stations.size} stations from Firebase`);
  } catch (error) {
    console.error('❌ Error loading stations from Firebase:', error);
  }
}

// Save station to Firebase
async function saveStationToFirebase(station) {
  try {
    const stationRef = db.collection('stations').doc(station.id);
    await stationRef.set({
      ...station,
      created_at: admin.firestore.Timestamp.fromDate(new Date(station.created_at || new Date())),
      updated_at: admin.firestore.Timestamp.fromDate(new Date())
    });
    console.log('💾 Station saved to Firebase:', station.id);
  } catch (error) {
    console.error('❌ Error saving station to Firebase:', error);
  }
}

// Delete station from Firebase
async function deleteStationFromFirebase(stationId) {
  try {
    const stationRef = db.collection('stations').doc(stationId);
    await stationRef.delete();
    console.log('🗑️ Station deleted from Firebase:', stationId);
  } catch (error) {
    console.error('❌ Error deleting station from Firebase:', error);
  }
}

// Initialize data loading
async function initializeServer() {
  if (!useLocalBackend && db) {
    await loadReportsFromFirebase();
    await loadMessagesFromFirebase();
    await loadStationsFromFirebase();
  } else {
    console.log('📱 Offline mode: Skipping Firebase data loading');
  }
}

// WebSocket connection
io.on('connection', (socket) => {
  console.log('✅ New client connected:', socket.id);

  // Authentication
  socket.on('authenticate', (userData) => {
    console.log('User authenticated:', userData.email);
    socket.userId = userData.userId || socket.id;
    socket.userData = userData;

    // Send success response
    socket.emit('auth_success', {
      ...userData,
      message: 'Authentication successful'
    });

    // Send existing reports
    socket.emit('initial_reports', Array.from(reports.values()));
  });

  // Submit report
  socket.on('submit_report', async (reportData) => {
    console.log('📝 New report:', reportData.type);

    const reportId = reportData.id || `report_${Date.now()}`;
    const fullReport = {
      ...reportData,
      id: reportId,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    reports.set(reportId, fullReport);

    // Save to Firebase only if not in offline mode
    if (!useLocalBackend && db) {
      await saveReportToFirebase(fullReport);
    }

    // Notify everyone
    io.emit('new_report', fullReport);

    // Send confirmation
    socket.emit('report_submitted', {
      success: true,
      report: fullReport
    });
  });

  // Update report status
  socket.on('update_report', async (updateData) => {
    console.log('🔄 Updating report:', updateData.reportId, 'to status:', updateData.status);

    const { reportId, status, notes } = updateData;

    if (reports.has(reportId)) {
      const existingReport = reports.get(reportId);
      const updatedReport = {
        ...existingReport,
        status: status,
        notes: notes || existingReport.notes,
        updatedAt: new Date().toISOString()
      };

      reports.set(reportId, updatedReport);

      // Save to Firebase only if not in offline mode
      if (!useLocalBackend && db) {
        await saveReportToFirebase(updatedReport);
      }

      // Notify all clients
      io.emit('report_updated', updatedReport);

      console.log('✅ Report updated successfully');
    } else {
      console.log('❌ Report not found:', reportId);
      socket.emit('report_update_error', {
        reportId,
        error: 'Report not found'
      });
    }
  });

  // Join report chat
  socket.on('join_report_chat', (data) => {
    const { reportId } = data;
    console.log('👥 User joined chat for report:', reportId);

    // Send existing chat messages for this report
    const reportMessages = messages.get(reportId) || [];
    socket.emit('chat_history', { reportId, messages: reportMessages });

    // Join the room for this report
    socket.join(`report_${reportId}`);
  });

  // Chat message
  socket.on('report_chat_message', async (messageData) => {
    console.log('💬 New chat message for report:', messageData.reportId);

    const { reportId } = messageData;
    const message = {
      ...messageData,
      timestamp: new Date().toISOString(),
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Store the message
    if (!messages.has(reportId)) {
      messages.set(reportId, []);
    }
    messages.get(reportId).push(message);

    // Save to Firebase only if not in offline mode
    if (!useLocalBackend && db) {
      await saveMessageToFirebase(message);
    }

    // Broadcast the complete message (with id and timestamp) to all users in this report's room
    io.to(`report_${reportId}`).emit('new_chat_message', message);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'B-READY Server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces for network access
server.listen(PORT, HOST, async () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🌐 WebSocket ready at ws://${HOST}:${PORT}`);
  console.log(`📡 Network access enabled - WebSocket available at ws://192.168.50.250:${PORT}`);

  // Initialize data from Firebase
  await initializeServer();
});
