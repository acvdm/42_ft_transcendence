import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

// Fonction qui initialise la DB et renvoie la connexion
export async function initDatabase(): Promise<Database> {
   const db = await open({ 
    filename: '/app/data/auth.sqlite', 
    driver: sqlite3.Database });

   await db.exec('PRAGMA foreign_keys = ON;');

    // Table CREDENTIALS
    await db.exec(`
      CREATE TABLE IF NOT EXISTS CREDENTIALS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        email TEXT UNIQUE NOT NULL CHECK (length(email) < 75),
        pwd_hashed TEXT UNIQUE,
        two_fa_secret TEXT,
        is_2fa_enabled INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('CREDENTIALS table created');

    // Table TOKENS
    await db.exec(`
      CREATE TABLE IF NOT EXISTS TOKENS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        credential_id INTEGER NOT NULL,
        refresh_token TEXT UNIQUE,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (credential_id) REFERENCES CREDENTIALS(id)
      )
    `);
    console.log('TOKENS table created');

    return db; // On renvoie la connexion

}