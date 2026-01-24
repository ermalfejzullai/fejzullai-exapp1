import { ipcMain, BrowserWindow } from 'electron';
import db from './db';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Store from 'electron-store';

const store = new Store();

export function registerApi() {
  ipcMain.handle('login', async (_, { username, password }) => {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user) return { success: false, message: 'User not found' };

    const match = await bcrypt.compare(password, user.password_hash);
    if (match) {
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
      return { success: true, user: { id: user.id, username: user.username, role: user.role } };
    } else {
      return { success: false, message: 'Invalid password' };
    }
  });

  ipcMain.handle('register-admin', async (_, { username, password }) => {
     // check if any user exists
     const count = db.prepare('SELECT count(*) as count FROM users').get() as any;
     if (count.count > 0) return { success: false, message: 'Admin already exists' };

     const hash = await bcrypt.hash(password, 10);
     db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')").run(username, hash);
     return { success: true };
  });

  ipcMain.handle('get-users', () => {
    return db.prepare('SELECT id, username, role, created_at, last_login FROM users').all();
  });

  ipcMain.handle('add-user', async (_, { username, password, adminId }) => {
    // Verify admin
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get(adminId) as any;
    if (!admin || admin.role !== 'admin') {
        return { success: false, message: 'Unauthorized: Only admins can add users.' };
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) return { success: false, message: 'Username already exists' };

    const hash = await bcrypt.hash(password, 10);
    // New users are always role 'user'
    const info = db.prepare("INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'user')").run(username, hash);
    return { success: true, id: info.lastInsertRowid };
  });

  ipcMain.handle('delete-user', (_, { userId, adminId }) => {
    // Verify admin
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get(adminId) as any;
    if (!admin || admin.role !== 'admin') {
        return { success: false, message: 'Unauthorized: Only admins can delete users.' };
    }
    
    // Check target user
    const targetUser = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as any;
    if (!targetUser) return { success: false, message: 'User not found' };

    if (targetUser.username === 'axiom') {
        return { success: false, message: 'Cannot delete the Super Admin.' };
    }

    // Prevent deleting self (redundant if axiom check covers it, but good for safety)
    if (userId === adminId) {
        return { success: false, message: 'Cannot delete yourself.' };
    }

    // Reassign or Nullify references to avoid Foreign Key constraints
    db.prepare('UPDATE exchange_rates SET updated_by = NULL WHERE updated_by = ?').run(userId);
    db.prepare('UPDATE rate_history SET changed_by = NULL WHERE changed_by = ?').run(userId);
    db.prepare('UPDATE transactions SET user_id = NULL WHERE user_id = ?').run(userId);

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return { success: true };
  });

  ipcMain.handle('clear-transactions', (_, { adminId }) => {
    // Verify admin
    const admin = db.prepare('SELECT role FROM users WHERE id = ?').get(adminId) as any;
    if (!admin || admin.role !== 'admin') {
        return { success: false, message: 'Unauthorized: Only admins can clear history.' };
    }

    // Because of ON DELETE CASCADE in transaction_details (if enabled), deleting transactions might be enough?
    // Wait, in `db.ts` I saw: `FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE`.
    // BUT `better-sqlite3` needs `PRAGMA foreign_keys = ON;` to be executed on connection.
    // `db.ts` only sets WAL mode. `db.pragma('journal_mode = WAL');`.
    // I should enable foreign keys there, OR manually delete details first.
    // Manually deleting is safer if unsure.
    db.prepare('DELETE FROM transaction_details').run();
    db.prepare('DELETE FROM transactions').run();
    return { success: true };
  });
  
  ipcMain.handle('check-users-exist', () => {
      const count = db.prepare('SELECT count(*) as count FROM users').get() as any;
      return count.count > 0;
  });

  ipcMain.handle('get-rates', () => {
    return db.prepare('SELECT * FROM exchange_rates').all();
  });

  ipcMain.handle('update-rates', (_, { rates, userId }) => {
    const updateStmt = db.prepare(`
      INSERT INTO exchange_rates (currency, buy_rate, sell_rate, updated_by, updated_at)
      VALUES (@currency, @buy_rate, @sell_rate, @updated_by, CURRENT_TIMESTAMP)
      ON CONFLICT(currency) DO UPDATE SET
        buy_rate = excluded.buy_rate,
        sell_rate = excluded.sell_rate,
        updated_by = excluded.updated_by,
        updated_at = CURRENT_TIMESTAMP
    `);

    const historyStmt = db.prepare(`
      INSERT INTO rate_history (currency, buy_rate, sell_rate, changed_by)
      VALUES (@currency, @buy_rate, @sell_rate, @updated_by)
    `);

    const transaction = db.transaction((rates) => {
      for (const rate of rates) {
        updateStmt.run({ ...rate, updated_by: userId });
        historyStmt.run({ ...rate, updated_by: userId });
      }
    });

    transaction(rates);
    return { success: true };
  });

  ipcMain.handle('save-transaction', (_, { type, details, userId }) => {
    const serialKey = `EXC-${uuidv4().slice(0, 8).toUpperCase()}`;
    // Calculate total MKD
    const totalMkd = details.reduce((sum: number, d: any) => sum + d.mkd_equivalent, 0);

    const insertTx = db.prepare(`
      INSERT INTO transactions (serial_key, transaction_type, user_id, total_mkd)
      VALUES (?, ?, ?, ?)
    `);

    const insertDetail = db.prepare(`
      INSERT INTO transaction_details (transaction_id, currency, amount, rate, mkd_equivalent)
      VALUES (?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      const info = insertTx.run(serialKey, type, userId, totalMkd);
      const txId = info.lastInsertRowid;

      for (const d of details) {
        insertDetail.run(txId, d.currency, d.amount, d.rate, d.mkd_equivalent);
      }
      return serialKey;
    });

    return { success: true, serialKey: transaction() };
  });

  ipcMain.handle('get-transactions', (_, { startDate, endDate, type, currency, serialKey }) => {
      let query = `
        SELECT t.*, u.username 
        FROM transactions t 
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
      `;
      const params: any[] = [];

      if (startDate) {
          query += ` AND t.transaction_date >= ?`;
          params.push(startDate);
      }
      if (endDate) {
          query += ` AND t.transaction_date <= ?`;
          params.push(endDate);
      }
      if (type && type !== 'ALL') {
          query += ` AND t.transaction_type = ?`;
          params.push(type);
      }
      if (serialKey) {
          query += ` AND t.serial_key LIKE ?`;
          params.push(`%${serialKey}%`);
      }
      
      // For currency filter, we need to join with details or check exists
      if (currency && currency !== 'ALL') {
          query += ` AND EXISTS (SELECT 1 FROM transaction_details td WHERE td.transaction_id = t.id AND td.currency = ?)`;
          params.push(currency);
      }

      query += ` ORDER BY t.transaction_date DESC`;

      const transactions = db.prepare(query).all(...params);
      
      // Fetch details for each transaction
      const detailsStmt = db.prepare('SELECT * FROM transaction_details WHERE transaction_id = ?');
      
      return transactions.map((t: any) => ({
          ...t,
          details: detailsStmt.all(t.id)
      }));
  });

  ipcMain.handle('get-settings', () => store.get('settings', {}));
  
  ipcMain.handle('save-settings', (_, settings) => {
    store.set('settings', settings);
    return { success: true };
  });

  ipcMain.handle('get-printers', async (event) => {
    return await event.sender.getPrintersAsync();
  });

  ipcMain.handle('print-invoice', async (_, htmlContent) => {
      // 80mm thermal paper = ~302px at 96 DPI
      const printWindow = new BrowserWindow({ 
          show: false, 
          width: 302, 
          height: 800,
          webPreferences: {
              nodeIntegration: false,
              contextIsolation: true
          }
      });
      
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      
      return new Promise((resolve) => {
          // Retrieve settings to check for preferred printer
          const settings: any = store.get('settings');
          const printerName = settings?.printerName;

          // Configure for thermal printer (80mm width, no margins)
          // Page size is controlled via CSS @page { size: 80mm auto; }
          const doPrint = () => {
              printWindow.webContents.print({
                  silent: !!printerName, // Silent if printer is set
                  deviceName: printerName, // Use specific printer if set
                  printBackground: true,
                  landscape: false,
                  margins: { marginType: 'none' }
              }, (success, errorType) => {
                  printWindow.close();
                  if (!success) console.log(errorType);
                  resolve(success);
              });
          };

          // Wait for fonts/assets to settle before printing to avoid layout shifts.
          printWindow.webContents
              .executeJavaScript('document.fonts ? document.fonts.ready : Promise.resolve()')
              .then(doPrint)
              .catch(doPrint);
      });
  });
}
