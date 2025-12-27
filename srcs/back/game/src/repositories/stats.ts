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
): Promise<Stat>
{
    const stats = await db.get(`
        SELECT * FROM STATS WHERE user_id = ?`,
        [userId]
    )

    if (!stats) {
        return {
            userId: userId,
            wins: 0,
            losses: 0,
            totalGames: 0,
            totalScore: 0,
            averageScore: 0,
            currentWinStreak: 0
        } as any;
    }

    const averageScore = stats.total_games > 0 
        ? parseFloat((stats.total_score / stats.total_games).toFixed(2)) 
        : 0;

    return {
        ...stats,
        averageScore
    } as Stat;
}


//-------- UPDATE 
export async function updateUserStats (
    db: Database,
    userId: number,
    userScore: number,
    isWinner: number
): Promise<Stat>
{
    const stats = await db.run(`
        UPDATE STATS SET 
            wins = wins + ?,
            losses = losses + ?,
            total_games = total_games + 1,
            total_score = total_score + ?,
            current_win_streak = CASE
                WHEN ? = 1 THEN current_win_streak +1
                ELSE 0
            END
        WHERE user_id = ?`,
        [
            isWinner ? 1 : 0,
            isWinner ? 0 : 1,
            userScore,
            isWinner ? 1 : 0,
            userId
        ]
    )
    
    return await findStatsByUserId(db, userId);
}
