import { Database } from 'sqlite'


export async function createTournament (
    db: Database,
    name: string
): Promise<number>
{
    const newTournament = await db.run(`
        INSERT INTO TOURNAMENTS (name)
        VALUES (?)`,
        [name]
    );

    return newTournament.lastID;
}
