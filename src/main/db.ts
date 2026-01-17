import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';

const dbPath = path.join(app.getPath('userData'), 'exchange.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT NOT NULL UNIQUE,
      buy_rate REAL NOT NULL,
      sell_rate REAL NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER,
      FOREIGN KEY (updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rate_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT NOT NULL,
      buy_rate REAL NOT NULL,
      sell_rate REAL NOT NULL,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      changed_by INTEGER,
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_key TEXT UNIQUE NOT NULL,
      transaction_type TEXT NOT NULL,
      transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER,
      total_mkd REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transaction_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      currency TEXT NOT NULL,
      amount REAL NOT NULL,
      rate REAL NOT NULL,
      mkd_equivalent REAL NOT NULL,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
    );
  `);
}

export default db;
