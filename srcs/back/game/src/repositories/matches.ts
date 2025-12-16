import { Database } from 'sqlite'



//-------- GET / READ

//-------- POST / CREATE
export async function createMatch (
    db: Database,
    type: string,
    tournamentId: number
): Promise<number>
{
    const newMatch = await db.run(`
        INSERT INTO MATCHES (game_type, fk_tournament_id)
        VALUES (?, ?)`,
        [type, tournamentId]
    );

    return newMatch.lastID;
}


//-------- PUT / PATCH / UPDATE

//-------- DELETE