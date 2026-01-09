import { Database } from 'sqlite'

export interface Stat {
    userId: number,
    wins: number,
    losses: number,
    totalGames: number,
    totalScore: number,
    averageScore: number,
    currentWinStreak: number,
    totalPlayTime: number
}

export interface HistoryFilters {
    page?: number;
    limit?: number;
    onlyWins?: boolean;
    gameType?: string;
    sortBy?: 'date_asc' | 'date_desc';
    opponent?: string;
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
    console.log(`stats = ${stats.userId}, ${stats.total_duration_in_minutes}`);

    if (!stats) {
        return {
            userId: userId,
            wins: 0,
            losses: 0,
            totalGames: 0,
            totalScore: 0,
            averageScore: 0,
            currentWinStreak: 0,
            totalPlayTime: 0
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

export async function getUserMatchHistory(
    db: Database,
    userId: number,
    filters: HistoryFilters
) {

    // 1. Paramètres par défaut
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    // 2. Base de la requête
    let sql = 
    `SELECT
        pm.score as my_score,
        pm.is_winner,
        pm.opponent as opponent_alias,
        m.game_type,
        m.finished_at,
        m.match_id,
        t.name as tournament_name
    FROM PLAYER_MATCH pm
    JOIN MATCHES m ON pm.match_id = m.match_id
    LEFT JOIN TOURNAMENTS t ON m.fk_tournament_id = t.tournament_id
    WHERE pm.user_id = ?
    `;

    // 3. Tableau des valeurs à injecter
    const params: any[] = [userId];

    // 4. Ajout dynamique des filtres
    if (filters.onlyWins)
    {
        sql += ` AND pm.is_winner = 1`;
    }

    if (filters.gameType)
    {
        sql += ` AND m.gameType = ?`;
        params.push(filters.gameType);
    }

    if (filters.opponent)
    {
        sql += ` AND pm.opponent = ?`
        params.push(filters.opponent);
    }

    // 5. Ajout des tris de sorting
    if (filters.sortBy === 'date_asc')
    {
        sql += ` ORDER BY m.finished_at ASC`;
    } 
    else
    {
        sql += ` ORDER BY m.finished_at DESC `;
    }

    // 6. Pagination
    sql += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 7. Execution
    const history = await db.all(sql, params);

    // // 8. Compter le total pour la pagination front
    // const countSql = `
    //     SELECT COUNT(*) as total
    //     FROM PLAYER_MATCH pm
    //     JOIN MATCHES m ON pm.match_id = m.match_id
    //     WHERE pm.user_id = ?
    //     ${filters.onlyWins ? 'AND pm.is_winner = 1' : ''}
    //     ${filters.gameType ? 'AND m.game_tyoe = ?' : ''}
    // `;

    // const countParams = [userId];
    // if (filters.gameType) countParams.push(filters.gameType);

    // const countRes = await db.get(countSql, countParams);

    return {
        data: history,
        // meta: {
        //     totalItems: countRes.total,
        //     currentPage: page,
        //     itemsPerPage: limit,
        //     totalPages: Math.ceil(countRes.total / limit)
        // }
    };
}   

//-------- UPDATE 
export async function updateUserStats (
    db: Database,
    userId: number,
    userScore: number,
    isWinner: number,
    finalDuration: number
): Promise<Stat>
{
    console.log(`final_duration = ${finalDuration}`);
    const stats = await db.run(`
        UPDATE STATS SET 
            wins = wins + ?,
            losses = losses + ?,
            total_score = total_score + ?,
            total_play_time_minutes = total_play_time_minutes + ?,
            current_win_streak = CASE
                WHEN ? = 1 THEN current_win_streak +1
                ELSE 0
            END
            
        WHERE user_id = ?`,
        [
            isWinner ? 1 : 0,
            isWinner ? 0 : 1,
            userScore,
            finalDuration,
            isWinner ? 1 : 0,
            userId            
        ]
    )
    
    return await findStatsByUserId(db, userId);
}
