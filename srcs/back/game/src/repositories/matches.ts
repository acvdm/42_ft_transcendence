import { Database } from 'sqlite'
import { NotFoundError } from '../utils/error.js';

export interface Match {
    matchId: number,
    gameType: string,
    status: string,
    startedAt: Date,
    finishedAT: Date,
    tournamentId: number
}


//-------- GET / READ
export async function findMatchById (
    db: Database,
    matchId: number
): Promise<number | undefined>
{
    const id = await db.get(`
        SELECT * FROM GAMES WHERE match_id = ?`
        [matchId]
    );

    return id;
}


//-------- POST / CREATE
export async function createMatch (
    db: Database,
    type: string,
    p1Alias: string,
    p2Alias: string,
    p1Score: number,
    p2Score: number,
    isP1Guest: boolean,
    isP2Guest: boolean,
    winnerAlias: string,
    status: string,
    round: string,
    tournamentId: number | null,
    startDate?: string | undefined,
    endDate?: string | undefined

): Promise<number | undefined>
{    

    let finalDuration = 1;

    if (startDate && endDate)
	{
		let start = new Date(startDate).getTime();
		let end = new Date(endDate).getTime();
		const diffInMins = end - start;
		const durationMinutes = Math.round(diffInMins / 60000);
		finalDuration = durationMinutes > 0 ? durationMinutes : 1;
	}

    const newMatch = await db.run(`
        INSERT INTO MATCHES (
            game_type, 
            player1_alias, 
            player2_alias, 
            score_p1, 
            score_p2, 
            winner_alias, 
            status, 
            round,
            fk_tournament_id,
            started_at,
            finished_at,
            total_duration_in_minutes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [type, p1Alias, p2Alias, p1Score, p2Score, winnerAlias, status, round, tournamentId, startDate, endDate, finalDuration]
    );

    return newMatch?.lastID;
}


//-------- PUT / PATCH / UPDATE

//-------- DELETE
export async function rollbackDeleteGame (
    db: Database,
    matchId: number
)
{
    const match = await findMatchById(db, matchId);
    if (!match) {
        throw new NotFoundError(`Error matchId: ${matchId} does not exist`);
    }

    await db.run(`
        DELETE FROM GAMES WHERE match_id = ?`,
        matchId
    );
}