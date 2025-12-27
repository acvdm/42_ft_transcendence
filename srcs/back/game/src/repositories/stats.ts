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

    // On verifie que l'ID existe bien
    if (newStat.lastID === undefined) {
        throw new Error("Failed: ID is missing")
    }

    return newStat.lastID;
}

/* TOURNAMENT 
-> fonciton utilitaire qui verifie si l'utilisateur qui a gagne est un vrai utilisateur inscrit 
Demande a la db si une ligne existe pour lui dans STATS, la cree avec INSERT si non
UPDATE si victoire ou defaite */
// updateStatsForUser