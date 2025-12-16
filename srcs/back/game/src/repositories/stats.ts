import { Database } from 'sqlite'


export async function createStat (
    db: Database,
    userId: number
): Promise<number>
{
    const newStat = await db.run(`
        INSERT INTO STATS (user_id)
        VALUES (?)`,
        [userId]
    );

    return newStat.lastID;
}