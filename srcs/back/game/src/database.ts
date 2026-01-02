import sqlite3 from 'sqlite3'; 
import { open, Database } from 'sqlite';

// Fonction qui initialise la DB et renvoie la connexion
export async function initDatabase(): Promise<Database>{
    const db = await open({ 
        filename: '/app/data/game.sqlite', 
        driver: sqlite3.Database });

    await db.exec('PRAGMA foreign_keys = ON;');

    // Table MATCHES
    await db.exec(`
        CREATE TABLE IF NOT EXISTS MATCHES (
            match_id INTEGER PRIMARY KEY AUTOINCREMENT,
            game_type TEXT,
            status TEXT DEFAULT 'pending',
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            finished_at DATETIME,
            fk_tournament_id INTEGER,
            FOREIGN KEY (fk_tournament_id) REFERENCES TOURNAMENTS(tournament_id)
        )
    `);

    // Table PLAYER_MATCH
    // pour le tournois local besoin de gerer des invites sans compte
    // donc modification pour accepter des alias et enlever la contrainte NOT NULL sur l'ID
    // adapter le fichier player_match.ts en consequence
    // utiliser user_id au lieu de player_id
    // user_id === player_id
    await db.exec(`
        CREATE TABLE IF NOT EXISTS PLAYER_MATCH (
            match_id INTEGER NOT NULL,
            game_type TEXT NOT NULL,
            user_id INTEGER,
            opponent TEXT,
            score INTEGER DEFAULT 0,
            is_winner INTEGER DEFAULT 0,
            FOREIGN KEY (match_id) REFERENCES MATCHES(match_id)
        )
    `);


    // Table TOURNAMENTS
    // winner_alias = TEXT car winner n'a potentiellement pas d'id
    await db.exec(`
        CREATE TABLE IF NOT EXISTS TOURNAMENTS (
            tournament_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            begin_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            end_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'not started',
            nb_of_participants INTEGER DEFAULT 4,
            winner_alias TEXT
        )
    `);

    // Table STATS
    await db.exec(`
        CREATE TABLE IF NOT EXISTS STATS (
            user_id INTEGER NOT NULL,
            wins INTEGER DEFAULT 0,
            losses INTEGER DEFAULT 0,
            total_games INTEGER GENERATED ALWAYS AS (wins + losses) STORED,
            total_score INTEGER,
            current_win_streak INTEGER DEFAULT 0,
            PRIMARY KEY (user_id)
        )
    `);

    return db;
}
