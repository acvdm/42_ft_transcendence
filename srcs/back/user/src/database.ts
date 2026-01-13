import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

// Fonction qui initialise la DB et renvoie la connexion
export async function initDatabase(): Promise<Database> {
    const db = await open({ filename: 
        '/app/data/user.sqlite', 
        driver:sqlite3.Database });
    
    // permet l'utilisation de foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');

    // Table USERS
    // j'ajoute un avatar par default ici!
    await db.exec(`
       CREATE TABLE IF NOT EXISTS USERS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alias TEXT UNIQUE NOT NULL CHECK (length(alias) <= 30),
        bio TEXT CHECK (length(bio) <= 75),
        avatar_url TEXT DEFAULT '/assets/basic/default.png',
        theme TEXT DEFAULT 'Blue', 
        status TEXT DEFAULT 'Available',
        is_guest INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ) 
    `);
    console.log('USERS table created');

    // TABLE FRIENDSHIPS
    await db.exec(`
        CREATE TABLE IF NOT EXISTS FRIENDSHIPS (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            friend_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    console.log('FRIENDSHIPS table created');

    return db;
}