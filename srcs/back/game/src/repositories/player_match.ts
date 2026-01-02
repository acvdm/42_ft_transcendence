import { Database } from 'sqlite'


// export async function addPlayerToMatch (
//     db: Database,
//     matchId: number,
//     userId: number
// ): Promise<number | undefined>
// {
//     const newPlayer = await db.run(`
//         INSERT INTO PLAYER_MATCH (match_id, user_id)
//         VALUES (?, ?)`,
//         [matchId, userId]
//     );

//     // On verifie que l'ID existe bien
//     if (newPlayer.lastID === undefined) {
//         throw new Error("Failed: ID is missing")
//     }

//     return newPlayer.lastID;
// }

// -- CREATE
export async function createPlayerMatch(
    db: Database,
    gameType: string,
    matchId: number,
    userId: number,
    opponent: string,
    score: number,
    isWinner: number
): Promise<number | undefined>
{
    console.log("** Create player game");
    const playerMatch = await db.run(`
        INSERT INTO PLAYER_MATCH
            (match_id,
            game_type,
            user_id,
            opponent,
            score,
            is_winner)
        VALUES(?, ?, ?, ?, ?, ?)`,
        [   matchId,
            gameType,
            userId,
            opponent,
            score,
            isWinner ? 1 : 0,
        ]
    )

    if (!playerMatch?.lastID)
    {
        console.log("create player game failed");
        throw new Error("Failed to create player match statistics");
    }

    console.log("** create match player fonctionné")

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