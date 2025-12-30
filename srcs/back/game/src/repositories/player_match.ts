import { Database } from 'sqlite'


export async function addPlayerToMatch (
    db: Database,
    matchId: number,
    userId: number
): Promise<number | undefined>
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


// -- DELETE
export async function rollbackDeletePlayerFromMatch(
    db: Database,
    matchId: number,
    userId: number    
)
{
    await db.run(`
        DELETE FROM PLAYER_MATCHES WHERE match_id = ? AND user_id = ?`,
        [matchId, userId]
    );
}