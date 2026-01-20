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

  async execute(sql: string, params: unknown[] = []): Promise<mysql.ResultSetHeader> {
    const conn = await this.connect();
    try {
      const [result] = await conn.execute(sql, params);
      return result as mysql.ResultSetHeader;
    } catch (error) {
      console.error('❌ MySQL Execute Error:', error);
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

    // Emergency stations table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS emergency_stations (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        lat DECIMAL(10, 8) NOT NULL,
        lng DECIMAL(11, 8) NOT NULL,
        address TEXT,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Safety tips table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS safety_tips (
        id VARCHAR(50) PRIMARY KEY,
        icon VARCHAR(10) DEFAULT '📋',
        title VARCHAR(255) NOT NULL,
        items JSON NOT NULL,
        category ENUM('disaster', 'emergency_kit') DEFAULT 'disaster',
        \`order\` INT DEFAULT 1,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Emergency kit items table
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS emergency_kit_items (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        items JSON NOT NULL,
        \`order\` INT DEFAULT 1,
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert default stations if they don't exist
    const defaultStations = [
      {
        id: 'station_1',
        name: 'Manila Central Fire Station',
        lat: 14.5995,
        lng: 120.9842,
        address: 'Manila, Metro Manila, Philippines'
      },
      {
        id: 'station_2',
        name: 'Cebu City Fire Station',
        lat: 10.3157,
        lng: 123.8854,
        address: 'Cebu City, Cebu, Philippines'
      },
      {
        id: 'station_3',
        name: 'Davao City Fire Station',
        lat: 7.1907,
        lng: 125.4553,
        address: 'Davao City, Davao del Sur, Philippines'
      },
      {
        id: 'station_4',
        name: 'Baguio Emergency Response Center',
        lat: 16.4023,
        lng: 120.5960,
        address: 'Baguio City, Benguet, Philippines'
      }
    ];

    for (const station of defaultStations) {
      await conn.execute(
        `INSERT IGNORE INTO emergency_stations (id, name, lat, lng, address) VALUES (?, ?, ?, ?, ?)`,
        [station.id, station.name, station.lat, station.lng, station.address]
      );
    }

    // Insert default safety tips if they don't exist
    const defaultTips = [
      {
        id: 'tip_1',
        icon: '🌊',
        title: 'Flood Safety',
        items: JSON.stringify([
          'Move to higher ground immediately when flooding occurs',
          'Keep emergency supplies ready',
          'Avoid walking or driving through floodwaters',
          'Disconnect electrical appliances',
        ]),
        category: 'disaster',
        order: 1
      },
      {
        id: 'tip_2',
        icon: '🔥',
        title: 'Fire Safety',
        items: JSON.stringify([
          'Install smoke alarms and check regularly',
          'Keep fire extinguishers accessible',
          'Never leave cooking unattended',
          'Know your escape routes',
        ]),
        category: 'disaster',
        order: 2
      },
      {
        id: 'tip_3',
        icon: '🌋',
        title: 'Earthquake Safety',
        items: JSON.stringify([
          'Drop, cover, and hold on during shaking',
          'Stay away from windows and heavy objects',
          'Prepare a family emergency plan',
          'Evacuate if building is unsafe',
        ]),
        category: 'disaster',
        order: 3
      },
      {
        id: 'tip_4',
        icon: '🌀',
        title: 'Typhoon Safety',
        items: JSON.stringify([
          'Secure your home and outdoor items',
          'Monitor weather updates',
          'Evacuate early if advised',
          'Keep emergency contacts handy',
        ]),
        category: 'disaster',
        order: 4
      },
      {
        id: 'tip_5',
        icon: '🚨',
        title: 'General Preparedness',
        items: JSON.stringify([
          'Know evacuation routes and centers',
          'Keep important documents waterproof',
          'Help neighbors, especially elderly',
          'Report hazards immediately',
        ]),
        category: 'disaster',
        order: 5
      },
      {
        id: 'tip_6',
        icon: '📱',
        title: 'Digital Safety',
        items: JSON.stringify([
          'Keep phone charged during emergencies',
          'Save emergency numbers',
          'Use B-READY for quick reporting',
          'Share location with trusted contacts',
        ]),
        category: 'disaster',
        order: 6
      },
    ];

    for (const tip of defaultTips) {
      await conn.execute(
        `INSERT IGNORE INTO safety_tips (id, icon, title, items, category, \`order\`) VALUES (?, ?, ?, ?, ?, ?)`,
        [tip.id, tip.icon, tip.title, tip.items, tip.category, tip.order]
      );
    }

    // Insert default emergency kit items if they don't exist
    const defaultKitItems = [
      {
        id: 'kit_1',
        title: 'Essential Items',
        items: JSON.stringify([
          'Water (1 gallon per person per day)',
          'Non-perishable food',
          'First aid kit',
          'Flashlight with batteries',
        ]),
        order: 1
      },
      {
        id: 'kit_2',
        title: 'Important Documents',
        items: JSON.stringify([
          'Identification cards',
          'Medical records',
          'Emergency contacts',
          'Insurance policies',
        ]),
        order: 2
      },
      {
        id: 'kit_3',
        title: 'Additional Supplies',
        items: JSON.stringify([
          'Prescription medications',
          'Personal hygiene items',
          'Multi-tool or knife',
          'Portable phone charger',
        ]),
        order: 3
      },
    ];

    for (const kit of defaultKitItems) {
      await conn.execute(
        `INSERT IGNORE INTO emergency_kit_items (id, title, items, \`order\`) VALUES (?, ?, ?, ?)`,
        [kit.id, kit.title, kit.items, kit.order]
      );
    }

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
