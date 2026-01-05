# B-READY Offline Emergency Reporting System

## Overview

Your teacher was absolutely correct! The original Firebase-only architecture had a critical flaw: **users couldn't report emergencies if they weren't logged in when internet connectivity was lost**.

This implementation adds **true offline capability** using MariaDB and PHP, allowing emergency reporting without any internet dependency.

## Architecture

### Current System (Firebase + Offline Enhancement)
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │────│   Socket.io     │────│   Firebase      │
│   (Frontend)    │    │   Server        │    │   (Cloud DB)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         │ Offline Mode
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PHP API       │────│   MariaDB       │    │   Local Server  │
│   (REST API)    │    │   (Local DB)    │    │   (No Internet) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features

- **🔴 Offline-First**: Report emergencies without internet
- **🔄 Auto-Sync**: Data syncs when connection restored
- **🏠 Local Database**: MariaDB runs on local network/server
- **🌐 Hybrid Mode**: Switches between Firebase and MariaDB automatically
- **📱 Anonymous Reporting**: No login required for offline reports

## Setup Instructions

### Quick Setup (Linux/Mac with Docker)

1. **Run the setup script:**
   ```bash
   ./setup-offline.sh
   ```

2. **Configure environment variables** in `.env.local`:
   ```env
   NEXT_PUBLIC_PHP_API_URL=http://localhost:8000/php-backend
   NEXT_PUBLIC_USE_LOCAL_BACKEND=true

   # MariaDB connection (optional, defaults provided)
   DB_HOST=localhost
   DB_USER=bready_user
   DB_PASS=bready_pass
   DB_NAME=bready_offline
   ```

3. **Start the services:**
   ```bash
   # Terminal 1: PHP API Server
   ./start-php-server.sh

   # Terminal 2: Next.js App
   npm run dev
   ```

4. **Access offline mode:**
   - Visit: `http://localhost:3000/offline`
   - Or: `http://localhost:3000` (will auto-detect offline mode)

### Manual Setup (Windows/Linux/Mac)

#### Option 1: XAMPP/WAMP (Windows)
1. Install XAMPP or WAMP server
2. Start Apache and MySQL modules
3. Open phpMyAdmin, create database `bready_offline`
4. Copy `php-backend/` folder to `htdocs/` directory
5. Access at: `http://localhost/php-backend`

#### Option 2: Docker (Cross-platform)
1. Install Docker Desktop
2. Run: `docker run -d --name mariadb-offline -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=bready_offline -p 3306:3306 mariadb:10.6`
3. Copy `php-backend/` to your web server directory

#### Option 3: Native Installation
1. Install MariaDB/MySQL server
2. Create database and user:
   ```sql
   CREATE DATABASE bready_offline;
   CREATE USER 'bready_user'@'localhost' IDENTIFIED BY 'bready_pass';
   GRANT ALL PRIVILEGES ON bready_offline.* TO 'bready_user'@'localhost';
   ```
3. Install PHP and web server (Apache/Nginx)
4. Copy `php-backend/` to web root

## How It Works

### 1. Online Mode (Default)
- Uses Firebase for authentication and real-time features
- Socket.io for live chat and updates
- Reports stored in Firestore

### 2. Offline Mode (Automatic)
When `navigator.onLine` is false OR `NEXT_PUBLIC_USE_LOCAL_BACKEND=true`:

- Frontend detects offline state
- Switches to MariaDB/PHP backend
- Reports stored locally in MariaDB
- No authentication required
- Data marked as "not synced"

### 3. Sync Process
When connection restored:

- System detects online state
- Uploads all `synced=false` records to Firebase
- Marks records as synced
- Continues with normal Firebase operation

## API Endpoints

### PHP Backend (`/php-backend/api.php`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports` | Get all reports |
| GET | `/reports?user_id=123` | Get user reports |
| POST | `/reports` | Create new report |
| PUT | `/reports` | Update report |
| GET | `/messages?report_id=123` | Get messages for report |
| POST | `/messages` | Create message |
| POST | `/sync` | Sync data to Firebase |
| GET | `/health` | Health check |

### Request/Response Examples

**Create Report:**
```json
POST /php-backend/api.php/reports
{
  "id": "offline_123456",
  "type": "Fire Emergency",
  "description": "Building fire reported",
  "timestamp": "2024-01-06T05:30:00Z",
  "userName": "Anonymous User",
  "severity": "high",
  "status": "pending",
  "category": "Fire",
  "icon": "🔥"
}
```

**Response:**
```json
{
  "success": true,
  "id": "offline_123456"
}
```

## Database Schema

### Reports Table
```sql
CREATE TABLE reports (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    description TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    address TEXT,
    timestamp DATETIME NOT NULL,
    user_id VARCHAR(100),
    user_name VARCHAR(200),
    severity ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'approved', 'current', 'rejected') DEFAULT 'pending',
    category VARCHAR(100),
    subcategory VARCHAR(100),
    icon VARCHAR(50),
    notes TEXT,
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Messages Table
```sql
CREATE TABLE messages (
    id VARCHAR(50) PRIMARY KEY,
    report_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    user_name VARCHAR(200) NOT NULL,
    user_role ENUM('admin', 'resident') DEFAULT 'resident',
    timestamp DATETIME NOT NULL,
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);
```

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_PHP_API_URL` | `http://localhost:8000/php-backend` | PHP API endpoint |
| `NEXT_PUBLIC_USE_LOCAL_BACKEND` | `false` | Force local mode |
| `DB_HOST` | `localhost` | MariaDB host |
| `DB_USER` | `root` | Database user |
| `DB_PASS` | `` | Database password |
| `DB_NAME` | `bready_offline` | Database name |
| `DB_PORT` | `3306` | Database port |

### Offline Service Configuration

```typescript
// lib/offline-service.ts
const offlineConfig: OfflineConfig = {
  phpApiUrl: process.env.NEXT_PUBLIC_PHP_API_URL || 'http://localhost:8000/php-backend',
  useLocalBackend: process.env.NEXT_PUBLIC_USE_LOCAL_BACKEND === 'true',
};
```

## Testing Offline Functionality

### 1. Browser Developer Tools
1. Open DevTools → Network tab
2. Check "Offline" to simulate no internet
3. Visit `/offline` - should work without network
4. Create a report - should store locally

### 2. Real Offline Testing
1. Disconnect from internet
2. Visit the offline page
3. Submit emergency report
4. Reconnect and check sync

### 3. API Testing
```bash
# Test PHP API health
curl http://localhost:8000/php-backend/api.php/health

# Test report creation
curl -X POST http://localhost:8000/php-backend/api.php/reports \
  -H "Content-Type: application/json" \
  -d '{"id":"test","type":"Test","timestamp":"2024-01-01T00:00:00Z"}'
```

## Troubleshooting

### Common Issues

**PHP API not responding:**
- Check if PHP server is running: `ps aux | grep php`
- Verify file permissions: `chmod 755 php-backend/api.php`
- Check PHP error logs

**Database connection failed:**
- Verify MariaDB is running: `sudo systemctl status mariadb`
- Check credentials in `php-backend/api.php`
- Test connection: `mysql -u bready_user -p bready_offline`

**Offline mode not working:**
- Check browser network status
- Verify environment variables
- Check console for JavaScript errors

**Sync not working:**
- Ensure Firebase credentials are valid
- Check network connectivity
- Verify `synced` field values in database

### Debug Commands

```bash
# Check PHP server
netstat -tlnp | grep :8000

# Check MariaDB
sudo systemctl status mariadb
mysql -u bready_user -p -e "SHOW TABLES FROM bready_offline;"

# Check Next.js logs
npm run dev 2>&1 | grep -i offline

# Test API endpoints
curl -s http://localhost:8000/php-backend/api.php/health
```

## Security Considerations

### Local Network Deployment
- Use HTTPS in production
- Implement proper authentication for admin functions
- Regular database backups
- Network firewall configuration

### Data Privacy
- Local data stays on local network
- No external data transmission unless configured
- User data anonymized for offline reports

## Future Enhancements

- **PWA Support**: Add service worker for true offline app
- **Data Encryption**: Encrypt sensitive local data
- **Conflict Resolution**: Handle sync conflicts
- **Offline Maps**: Cache map data locally
- **File Attachments**: Store photos locally
- **Multi-device Sync**: Sync between devices on same network

## Support

For issues or questions:
1. Check this README first
2. Review console logs for errors
3. Test API endpoints manually
4. Check database connectivity
5. Verify environment configuration

---

**Your teacher was right!** This MariaDB + PHP solution provides true offline emergency reporting capability, solving the critical flaw in the original Firebase-only design.
