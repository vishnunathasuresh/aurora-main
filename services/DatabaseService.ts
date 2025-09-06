import * as SQLite from 'expo-sqlite';

export interface SOSAlert {
  id?: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  status: 'pending' | 'sent' | 'failed';
  message?: string;
  contact_numbers?: string;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('aurora_safety.db');
      
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS sos_alerts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          timestamp TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          message TEXT,
          contact_numbers TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }

  async saveSOSAlert(alert: SOSAlert): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.runAsync(
        `INSERT INTO sos_alerts (latitude, longitude, timestamp, status, message, contact_numbers) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          alert.latitude,
          alert.longitude,
          alert.timestamp,
          alert.status,
          alert.message ?? null,
          alert.contact_numbers ?? null
        ]
      );
      
      return result.lastInsertRowId as number;
    } catch (error) {
      console.error('Failed to save SOS alert:', error);
      throw error;
    }
  }

  async getPendingAlerts(): Promise<SOSAlert[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM sos_alerts WHERE status = 'pending' ORDER BY created_at DESC`
      );
      
      return result as SOSAlert[];
    } catch (error) {
      console.error('Failed to get pending alerts:', error);
      return [];
    }
  }

  async updateAlertStatus(id: number, status: 'sent' | 'failed'): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.runAsync(
        `UPDATE sos_alerts SET status = ? WHERE id = ?`,
        [status, id]
      );
    } catch (error) {
      console.error('Failed to update alert status:', error);
      throw error;
    }
  }

  async getAllAlerts(): Promise<SOSAlert[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getAllAsync(
        `SELECT * FROM sos_alerts ORDER BY created_at DESC LIMIT 50`
      );
      
      return result as SOSAlert[];
    } catch (error) {
      console.error('Failed to get all alerts:', error);
      return [];
    }
  }
}

export const databaseService = new DatabaseService();