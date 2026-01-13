import { Database } from 'sqlite'

// -- CREATE
export async function addPlayerMatch(
    db: Database,
    gameType: string,
    matchId: number,
    userId: number,
    opponent: string,
    userScore: number,
    opponentScore: number,
    isWinner: number
): Promise<number | undefined>
{
    const playerMatch = await db.run(`
        INSERT INTO PLAYER_MATCH
            (match_id,
            game_type,
            user_id,
            opponent,
            score,
            opponent_score,
            is_winner)
        VALUES(?, ?, ?, ?, ?, ?, ?)`,
        [   matchId,
            gameType,
            userId,
            opponent,
            userScore,
            opponentScore,
            isWinner ? 1 : 0,
        ]
    )

    if (!playerMatch?.lastID)
    {
        console.log("create player game failed");
        throw new Error("Failed to create player match statistics");
    }

    return (playerMatch?.lastID);
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