import mysql from 'mysql2/promise';

interface MySQLConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port?: number;
}

class MySQLConnection {
  private config: MySQLConfig;
  private connection: mysql.Connection | null = null;

  constructor(config: MySQLConfig) {
    this.config = config;
  }

  async connect(): Promise<mysql.Connection> {
    if (!this.connection) {
      this.connection = await mysql.createConnection(this.config);
      console.log('✅ Connected to MariaDB');
    }
    return this.connection;
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      console.log('❌ Disconnected from MariaDB');
    }
  }

  async query(sql: string, params: unknown[] = []): Promise<mysql.RowDataPacket[]> {
    const conn = await this.connect();
    try {
      const [rows] = await conn.execute(sql, params);
      return rows as mysql.RowDataPacket[];
    } catch (error) {
      console.error('❌ MySQL Query Error:', error);
      throw error;
    }
  }

  async createTables(): Promise<void> {
    const conn = await this.connect();

    // Reports table
    await conn.execute(`
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
      )
    `);

    // Messages table
    await conn.execute(`
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
      )
    `);

    // Offline users table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS offline_users (
        id VARCHAR(100) PRIMARY KEY,
        email VARCHAR(255) UNIQUE,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(50),
        address TEXT,
        role ENUM('admin', 'resident') DEFAULT 'resident',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('📋 MariaDB tables initialized');
  }
}

// Create singleton instance
const mysqlConfig: MySQLConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'bready_offline',
  port: parseInt(process.env.DB_PORT || '3306'),
};

export const mysqlConnection = new MySQLConnection(mysqlConfig);
export default mysqlConnection;
