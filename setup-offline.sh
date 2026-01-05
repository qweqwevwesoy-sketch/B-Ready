#!/bin/bash

echo "🚨 B-READY Offline Setup Script"
echo "================================="

# Check if running on Windows
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "❌ This setup script is for Linux/Mac. For Windows, please:"
    echo "1. Install XAMPP or WAMP server"
    echo "2. Start Apache and MySQL"
    echo "3. Create database 'bready_offline'"
    echo "4. Copy php-backend/ to your web server root"
    echo "5. Run the Next.js app with npm run dev"
    exit 1
fi

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Docker detected. Setting up MariaDB with Docker..."

    # Create docker-compose.yml for MariaDB
    cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  mariadb:
    image: mariadb:10.6
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: bready_offline
      MYSQL_USER: bready_user
      MYSQL_PASSWORD: bready_pass
    ports:
      - "3306:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./init-db.sql:/docker-entrypoint-initdb.d/init-db.sql

volumes:
  mariadb_data:
EOF

    # Create init script
    cat > init-db.sql << 'EOF'
-- B-READY Offline Database Initialization

CREATE DATABASE IF NOT EXISTS bready_offline;
USE bready_offline;

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
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

-- Offline users table
CREATE TABLE IF NOT EXISTS offline_users (
    id VARCHAR(100) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    role ENUM('admin', 'resident') DEFAULT 'resident',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create test data
INSERT INTO reports (id, type, description, address, timestamp, user_name, severity, status, category, icon) VALUES
('test_001', 'Fire Emergency', 'Test fire emergency report', 'Test Address', NOW(), 'Test User', 'high', 'pending', 'Fire', '🔥'),
('test_002', 'Medical Emergency', 'Test medical emergency report', 'Test Address', NOW(), 'Test User', 'high', 'approved', 'Medical', '🚑')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO messages (id, report_id, text, user_name, user_role, timestamp) VALUES
('msg_test_001', 'test_001', 'Test message for fire emergency', 'Admin', 'admin', NOW()),
('msg_test_002', 'test_002', 'Test message for medical emergency', 'Responder', 'admin', NOW())
ON DUPLICATE KEY UPDATE id=id;
EOF

    # Start MariaDB
    echo "🚀 Starting MariaDB container..."
    docker-compose up -d

    echo "⏳ Waiting for MariaDB to be ready..."
    sleep 10

    echo "✅ MariaDB setup complete!"
    echo ""
    echo "📋 Connection Details:"
    echo "Host: localhost"
    echo "Port: 3306"
    echo "Database: bready_offline"
    echo "Username: bready_user"
    echo "Password: bready_pass"
    echo ""

elif command -v mysql &> /dev/null; then
    echo "💾 MySQL/MariaDB detected. Setting up database..."

    # Create database
    sudo mysql -u root -p << 'EOF'
CREATE DATABASE IF NOT EXISTS bready_offline;
CREATE USER IF NOT EXISTS 'bready_user'@'localhost' IDENTIFIED BY 'bready_pass';
GRANT ALL PRIVILEGES ON bready_offline.* TO 'bready_user'@'localhost';
FLUSH PRIVILEGES;
EOF

    echo "✅ Database setup complete!"

else
    echo "❌ Neither Docker nor MySQL/MariaDB found."
    echo ""
    echo "📋 To set up offline mode manually:"
    echo "1. Install MariaDB or MySQL"
    echo "2. Create database 'bready_offline'"
    echo "3. Create user 'bready_user' with password 'bready_pass'"
    echo "4. Grant all privileges on bready_offline to bready_user"
    echo "5. Copy php-backend/ to your web server (Apache/Nginx)"
    echo "6. Access offline mode at: /offline"
    exit 1
fi

# Setup PHP backend
echo "🌐 Setting up PHP backend..."

# Check if PHP is available
if command -v php &> /dev/null; then
    echo "✅ PHP found. Starting built-in server..."

    # Create a simple PHP server script
    cat > start-php-server.sh << 'EOF'
#!/bin/bash
cd php-backend
php -S localhost:8000
EOF

    chmod +x start-php-server.sh

    echo "✅ PHP backend setup complete!"
    echo ""
    echo "🚀 To start the offline system:"
    echo "1. Terminal 1: ./start-php-server.sh"
    echo "2. Terminal 2: npm run dev"
    echo "3. Visit: http://localhost:3000/offline"

else
    echo "⚠️  PHP not found. You'll need to serve php-backend/ with a web server."
    echo ""
    echo "📋 Manual setup:"
    echo "1. Install Apache/Nginx with PHP"
    echo "2. Copy php-backend/ to web root"
    echo "3. Access offline mode at: /offline"
fi

echo ""
echo "🎉 Setup complete! Your offline emergency reporting system is ready."
echo ""
echo "📱 Access offline mode at: http://localhost:3000/offline"
echo "🔧 Configure environment variables in .env.local:"
echo "NEXT_PUBLIC_PHP_API_URL=http://localhost:8000/php-backend"
echo "NEXT_PUBLIC_USE_LOCAL_BACKEND=true"
