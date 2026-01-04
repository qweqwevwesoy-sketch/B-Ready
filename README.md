# B-READY - Barangay Disaster Reporting System

A Next.js application for real-time emergency reporting, community coordination, and rapid response.

## Features

- 🔐 **Firebase Authentication** - Secure user authentication with role-based access
- 📡 **Real-time Communication** - Socket.IO for live updates and chat
- 📍 **Location Services** - Map picker with geocoding for accurate location reporting
- 📷 **Camera Integration** - Photo capture for emergency reports
- 🌐 **Multi-language Support** - Google Translate integration
- 📊 **Report Management** - Status tracking (Pending, Current, Approved)
- 👥 **Role-based Access** - Separate interfaces for Residents and Administrators

## Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication and Firestore enabled
- Socket.IO server running (see `server/server.js`)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable Authentication (Email/Password)
4. Create a Firestore database
5. Get your Firebase configuration from Project Settings

### 3. Create Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Socket.IO Server URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**Important:** Replace all placeholder values with your actual Firebase credentials.

### 4. Set Up Firestore Collections

The app expects a `users` collection in Firestore with the following structure:

```typescript
{
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  employeeId?: string; // Required for admin accounts
  role: 'resident' | 'admin';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 5. Start the Socket.IO Server

```bash
cd server
npm install
npm run dev
```

The server will run on `http://localhost:3001`

### 6. Start the Next.js Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
b-ready-nextjs/
├── app/                    # Next.js app router pages
│   ├── dashboard/          # Main dashboard
│   ├── login/              # Login page
│   ├── signup/             # Signup page
│   ├── profile/             # User profile
│   ├── safety-tips/        # Safety tips page
│   └── status-update/      # Admin status management
├── components/              # React components
│   ├── ChatBox.tsx          # Chat interface with camera
│   ├── FAB.tsx              # Floating action button
│   ├── Header.tsx           # Navigation header
│   ├── MapPicker.tsx        # Location picker
│   └── ...
├── contexts/                # React contexts
│   ├── AuthContext.tsx      # Authentication state
│   └── SocketContext.tsx    # Socket.IO state
├── lib/                     # Utility functions
│   ├── firebase.ts          # Firebase configuration
│   ├── socket-client.ts     # Socket.IO client
│   └── utils.ts             # Helper functions
├── types/                   # TypeScript types
└── server/                  # Socket.IO server
```

## Usage

### For Residents

1. Sign up with email and password
2. Select your location on the map
3. Click the chat button (💬) to report emergencies
4. Choose emergency category or use quick report
5. Add description and photos
6. Track your reports in the dashboard

### For Administrators

1. Sign up with admin account type and Employee ID
2. View all reports in the dashboard
3. Approve/reject pending reports
4. Update report statuses
5. Communicate with residents via chat

## Troubleshooting

### Firebase API Key Error

If you see "api-key-not-valid" error:
- Ensure your `.env.local` file exists and has correct values
- Restart the development server after adding environment variables
- Verify Firebase project settings match your configuration

### Socket.IO Connection Issues

- Ensure the Socket.IO server is running on port 3001
- Check that `NEXT_PUBLIC_SOCKET_URL` matches your server URL
- Verify CORS settings in `server/server.js`

### Map Not Loading

- Check browser console for Leaflet errors
- Ensure internet connection for OpenStreetMap tiles
- Verify geolocation permissions are granted

## Development

```bash
# Run development server
npm run dev

# Run Socket.IO server
npm run dev:server

# Run both simultaneously
npm run dev:all

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT
"# B-Ready-nextjs" 
