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
        email TEXT UNIQUE NOT NULL CHECK (length(email) <= 254),
        pwd_hashed TEXT UNIQUE NOT NULL CHECK (length(pwd_hashed) <= 512),
        two_fa_secret TEXT UNIQUE,
        two_fa_method TEXT DEFAULT 'NONE' CHECK(two_fa_method IN ('NONE', 'APP', 'EMAIL')),
        email_otp TEXT,
        email_otp_expires_at DATETIME,
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

