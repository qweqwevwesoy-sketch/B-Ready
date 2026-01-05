<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Database configuration
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'bready_offline');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');

// Connect to database
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }
    return $pdo;
}

// Initialize database tables
function initDatabase() {
    $pdo = getDB();

    // Reports table
    $pdo->exec("
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
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            synced BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");

    // Messages table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS messages (
            id VARCHAR(50) PRIMARY KEY,
            report_id VARCHAR(50) NOT NULL,
            text TEXT NOT NULL,
            user_name VARCHAR(200) NOT NULL,
            user_role ENUM('admin', 'resident') DEFAULT 'resident',
            timestamp DATETIME NOT NULL,
            synced BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
        )
    ");

    // Users table (for offline mode)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS offline_users (
            id VARCHAR(100) PRIMARY KEY,
            email VARCHAR(255) UNIQUE,
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            phone VARCHAR(50),
            address TEXT,
            role ENUM('admin', 'resident') DEFAULT 'resident',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$path = str_replace('/php-backend/', '', $path);
$path = trim($path, '/');

// Parse query parameters for GET requests
$query = [];
if (isset($_SERVER['QUERY_STRING'])) {
    parse_str($_SERVER['QUERY_STRING'], $query);
}

// Initialize database
initDatabase();

// Route handling
try {
    switch ($method) {
        case 'GET':
            switch ($path) {
                case 'reports':
                    getReports($query);
                    break;
                case 'messages':
                    getMessages($query);
                    break;
                case 'health':
                    echo json_encode(['status' => 'OK', 'message' => 'B-READY Offline API is running']);
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Endpoint not found']);
            }
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            switch ($path) {
                case 'reports':
                    createReport($input);
                    break;
                case 'messages':
                    createMessage($input);
                    break;
                case 'sync':
                    syncData($input);
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Endpoint not found']);
            }
            break;

        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            switch ($path) {
                case 'reports':
                    updateReport($input);
                    break;
                default:
                    http_response_code(404);
                    echo json_encode(['error' => 'Endpoint not found']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

// API Functions
function getReports($query) {
    $pdo = getDB();
    $where = [];
    $params = [];

    if (isset($query['user_id'])) {
        $where[] = 'user_id = ?';
        $params[] = $query['user_id'];
    }

    if (isset($query['status'])) {
        $where[] = 'status = ?';
        $params[] = $query['status'];
    }

    if (isset($query['synced'])) {
        $where[] = 'synced = ?';
        $params[] = $query['synced'] ? 1 : 0;
    }

    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $pdo->prepare("SELECT * FROM reports $whereClause ORDER BY timestamp DESC");
    $stmt->execute($params);
    $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($reports);
}

function createReport($data) {
    $pdo = getDB();

    $required = ['id', 'type', 'timestamp'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            return;
        }
    }

    $stmt = $pdo->prepare("
        INSERT INTO reports (id, type, description, location_lat, location_lng, address, timestamp,
                           user_id, user_name, severity, status, category, subcategory, icon, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");

    $stmt->execute([
        $data['id'],
        $data['type'],
        $data['description'] ?? '',
        $data['location'] ? $data['location']['lat'] : null,
        $data['location'] ? $data['location']['lng'] : null,
        $data['address'] ?? '',
        $data['timestamp'],
        $data['userId'] ?? null,
        $data['userName'] ?? 'Anonymous',
        $data['severity'] ?? 'medium',
        $data['status'] ?? 'pending',
        $data['category'] ?? '',
        $data['subcategory'] ?? '',
        $data['icon'] ?? '🚨',
        isset($data['synced']) ? $data['synced'] : false
    ]);

    echo json_encode(['success' => true, 'id' => $data['id']]);
}

function updateReport($data) {
    $pdo = getDB();

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Report ID required']);
        return;
    }

    $updates = [];
    $params = [];

    if (isset($data['status'])) {
        $updates[] = 'status = ?';
        $params[] = $data['status'];
    }

    if (isset($data['notes'])) {
        $updates[] = 'notes = ?';
        $params[] = $data['notes'];
    }

    if (isset($data['synced'])) {
        $updates[] = 'synced = ?';
        $params[] = $data['synced'];
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['error' => 'No valid fields to update']);
        return;
    }

    $updates[] = 'updated_at = CURRENT_TIMESTAMP';
    $params[] = $data['id'];

    $stmt = $pdo->prepare("UPDATE reports SET " . implode(', ', $updates) . " WHERE id = ?");
    $stmt->execute($params);

    echo json_encode(['success' => true]);
}

function getMessages($query) {
    $pdo = getDB();

    if (!isset($query['report_id'])) {
        http_response_code(400);
        echo json_encode(['error' => 'report_id parameter required']);
        return;
    }

    $stmt = $pdo->prepare("SELECT * FROM messages WHERE report_id = ? ORDER BY timestamp ASC");
    $stmt->execute([$query['report_id']]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($messages);
}

function createMessage($data) {
    $pdo = getDB();

    $required = ['reportId', 'text', 'userName', 'timestamp'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            return;
        }
    }

    $stmt = $pdo->prepare("
        INSERT INTO messages (id, report_id, text, user_name, user_role, timestamp, synced)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");

    $id = $data['id'] ?? 'msg_' . time() . '_' . rand(1000, 9999);

    $stmt->execute([
        $id,
        $data['reportId'],
        $data['text'],
        $data['userName'],
        $data['userRole'] ?? 'resident',
        $data['timestamp'],
        isset($data['synced']) ? $data['synced'] : false
    ]);

    echo json_encode(['success' => true, 'id' => $id]);
}

function syncData($data) {
    $pdo = getDB();

    $syncedReports = 0;
    $syncedMessages = 0;

    // Sync reports
    if (isset($data['reports']) && is_array($data['reports'])) {
        foreach ($data['reports'] as $report) {
            try {
                $stmt = $pdo->prepare("UPDATE reports SET synced = TRUE WHERE id = ?");
                $stmt->execute([$report['id']]);
                $syncedReports++;
            } catch (Exception $e) {
                // Continue with other reports
            }
        }
    }

    // Sync messages
    if (isset($data['messages']) && is_array($data['messages'])) {
        foreach ($data['messages'] as $message) {
            try {
                $stmt = $pdo->prepare("UPDATE messages SET synced = TRUE WHERE id = ?");
                $stmt->execute([$message['id']]);
                $syncedMessages++;
            } catch (Exception $e) {
                // Continue with other messages
            }
        }
    }

    echo json_encode([
        'success' => true,
        'synced_reports' => $syncedReports,
        'synced_messages' => $syncedMessages
    ]);
}
?>
