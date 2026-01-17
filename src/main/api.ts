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
      return { success: true, user: { id: user.id, username: user.username } };
    } else {
      return { success: false, message: 'Invalid password' };
    }
  });

  ipcMain.handle('register-admin', async (_, { username, password }) => {
     // check if any user exists
     const count = db.prepare('SELECT count(*) as count FROM users').get() as any;
     if (count.count > 0) return { success: false, message: 'Admin already exists' };

     const hash = await bcrypt.hash(password, 10);
     db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
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

  ipcMain.handle('get-settings', () => store.get('settings', { officeName: '', address: '', phone: '' }));
  
  ipcMain.handle('save-settings', (_, settings) => {
    store.set('settings', settings);
    return { success: true };
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
          // silent: false opens the system dialog
          // Configure for thermal printer (80mm width, no margins)
          // Page size is controlled via CSS @page { size: 80mm auto; }
          const doPrint = () => {
              printWindow.webContents.print({
                  silent: false,
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
