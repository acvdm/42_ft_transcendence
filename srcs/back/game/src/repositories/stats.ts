import { Database } from 'sqlite'


export interface Stat {
    userId: number,
    wins: number,
    losses: number,
    totalGames: number,
    totalScore: number,
    averageScore: number,
    currentWinStreak: number
}


//-------- POST / CREATE
export async function createStatLineforOneUser (
    db: Database,
    userId: number
): Promise<number | undefined>
{
    const newStat = await db.run(`
        INSERT INTO STATS (user_id)
        VALUES (?)`,
        [userId]
    );

    return newStat?.lastID;
}

//-------- GET / SELECT
export async function findStatsByUserId (
    db: Database,
    userId: number
): Promise<number | undefined>
{
    const stats = await db.get(`
        SELECT * FROM STATS WHERE player_id = ?`,
        [userId]
    )

    return stats.id || 0;
}