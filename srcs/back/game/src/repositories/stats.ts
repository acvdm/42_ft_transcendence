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

/* TOURNAMENT 
-> fonciton utilitaire qui verifie si l'utilisateurqui a gagne est un vrai utilisateur inscrit 
Demande a la db si une ligne existe pour lui dans STATS, la cree avec INSERT si non
UPDATE si victoire ou defaite */