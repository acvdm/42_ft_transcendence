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
    await db.exec(`
       CREATE TABLE IF NOT EXISTS USERS (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alias TEXT UNIQUE NOT NULL CHECK (length(alias) <= 30),
        avatar_url TEXT,
        bio TEXT CHECK (length(bio) < 255),
        status TEXT DEFAULT 'Available'
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (user_id, friend_id)
        )
    `);
    console.log('FRIENDSHIPS table created');

    // TABLE BLOCKINGS
    await db.exec(`
       CREATE TABLE IF NOT EXISTS BLOCKINGS (
        blocker_id INTEGER NOT NULL,
        blocked_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (blocker_id, blocked_id)) 
    `);
    console.log('BLOCKINGS table created');

    return db;
}