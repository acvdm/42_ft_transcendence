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
        msg_content TEXT NOT NULL,
        channel_id INTEGER NOT NULL,
        channel_name TEXT NOT NULL DEFAULT 'general',
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (channel_id) REFERENCES CHANNELS(id)
      )
    `);
    console.log('MESSAGES table created');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS CHANNELS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL DEFAULT 'general' CHECK (length(name) < 255),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('CHANNELS table created');

    // Plutôt faire une table d'évènements 
    // await db.exec(`
    //   CREATE TABLE IF NOT EXISTS CHANNEL_MEMBERS (
    //   channel_id INTEGER NOT NULL,
    //   user_id INTEGER NOT NULL,
    //   joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    //   PRIMARY KEY (channel_id, user_id),
    //   FOREIGN KEY (channel_id) REFERENCES CHANNELS(id)
    //   )
    // `);

    return db;
}