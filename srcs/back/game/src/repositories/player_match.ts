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

    // On verifie que l'ID existe bien
    if (newPlayer.lastID === undefined) {
        throw new Error("Failed: ID is missing")
    }

    return newPlayer.lastID;
}