import { Database } from 'sqlite';

export interface CreateUser {
    alias: string;
    avatar_url?: string;
}

export interface User {
    id: number,
    alias: string,
    avatar_url?: string,
    bio: string,
    status: string
}


//-------- POST / CREATE
export async function createUserInDB (
    db: Database,
    data: CreateUser
): Promise<number> {

    const check_alias = await db.get(`
        SELECT id FROM USERS WHERE alias = ?`,
        [data.alias]
    );
    if (check_alias?.id)
        throw new Error('Alias already taken, find another one');
    
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
export async function findUserByID (
    db: Database,
    user_id: number
): Promise<User>
{
    const user = await db.get(`
        SELECT * FROM USERS WHERE id = ?`,
        [user_id]
    );

    return user;
}

export async function findUserByAlias (
    db: Database,
    alias: string
): Promise<User>
{
    const user = await db.get(`
        SELECT * FROM USERS WHERE alias = ?`,
        [alias]
    );

    return user;
}



//-------- PUT / UPDATE
export async function updateStatus (
    db: Database,
    user_id: number,
    status: string
)
{
    const user = await findUserByID(db, user_id);
    if (!user?.id)
        throw new Error(`Error id: ${user_id} does not exist`);

    console.log("update status dans users.ts");
    await db.run(`
        UPDATE USERS SET status = ? WHERE id = ?`,
        [status, user_id]
    );

}

export async function updateBio (
    db: Database,
    user_id: number,
    bio: string
)
{
    const user = await findUserByID(db, user_id);
    if (!user?.id)
        throw new Error(`Error id: ${user_id} does not exist`);

    if (bio.length > 255)
        throw new Error(`Error: bio too long. Max 255 characters`);

    console.log("update bio dans users.ts");
    await db.run(`
        UPDATE USERS SET bio = ? WHERE id = ?`,
        [bio, user_id]
    );
}



//-------- DELETE / DELETE
export async function rollbackDeleteUser (
    db: Database,
    user_id: number
)
{
    const user = await findUserByID(db, user_id);
    if (!user.id) {
        throw new Error(`Error id: ${user_id} does not exist`);
    }

    await db.run(`
        DELETE FROM USERS WHERE id = ?`, 
        [user_id]
    );
}