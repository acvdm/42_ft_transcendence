import { Database } from 'sqlite'


export async function addPlayerToMatch (
    db: Database,
    matchId: number,
    userId: number
): Promise<number>
{
    const newPlayer = await db.run(`
        INSERT INTO PLAYER_MATCH (match_id, player_id)
        VALUES (?, ?)`,
        [matchId, userId]
    );

    return newPlayer.lastID;
}