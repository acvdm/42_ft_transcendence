import { Database } from 'sqlite';

export interface CreateUser {
    alias: string;
    avatar_url?: string;
}

//-------- POST / CREATE
export async function createUserInDB (
    db: Database,
    data: CreateUser
): Promise<number> {
    const result = await db.run(`
        INSERT INTO USERS (alias, avatar_url)
        VALUES (?, ?)`,
        [data.alias, data.avatar_url]
    );

    if (!result.lastID) {
        throw new Error('Failed to create new user');
    }

    return result.lastID;
}

//-------- GET / READ

//-------- PUT / UPDATE

//-------- DELETE / DELETE
