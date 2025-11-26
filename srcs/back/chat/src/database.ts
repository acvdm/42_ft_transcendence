import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

// ------------------------- INIT DATABASE
export async function initDatabase(): Promise<Database> {
    const db = await open({ 
      filename: '/app/data/chat.sqlite', 
      driver: sqlite3.Database });

    // Table MESSAGES
    await db.exec(`
      CREATE TABLE IF NOT EXISTS MESSAGES (
        msg_id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        recv_id INTEGER NOT NULL,
        msg_content TEXT NOT NULL,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('MESSAGES table created');

    return db;
}