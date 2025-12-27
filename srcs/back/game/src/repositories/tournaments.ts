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

    // On verifie que l'ID existe bien
    if (newTournament.lastID === undefined) {
        throw new Error("Failed: ID is missing")
    }

    return newTournament.lastID;
}


/* saveLocalTournament()
    recupere le fichierJSON
    inserer le tournoi (recup l'ID)
    boucler sur els 3 matchs
    inserer les joueurs dans PLAYER_MATCH en gerant le NULL pour le invites
    appeler create_stat si cest un vria joueur

 */