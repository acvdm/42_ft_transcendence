import { Database } from 'sqlite';
import { generateRandomAlias } from "../utils/guest.js"

export interface CreateUser {
    alias: string,
    avatar_url?: string
}

export interface User {
    id: number,
    alias: string,
    avatar_url?: string,
    bio: string,
    status: string,
    theme: string
}


//-------- POST / CREATE
export async function createUserInDB (
    db: Database,
    data: CreateUser
): Promise<number> {

    const checkAlias = await isAliasUsed(db, data.alias)
    if (checkAlias)
        throw new Error('Alias already taken, find another one');
    
    const avatarDefault = data.avatar_url || '/assets/basic/default.png'; // je rajoute ca pour avoir une image par default

    const result = await db.run(`
        INSERT INTO USERS (alias, avatar_url)
        VALUES (?, ?)`,
        [data.alias, avatarDefault]
    );

    if (!result.lastID) 
    {
        throw new Error('Failed to create new user');
    }

    console.log("createUserinDB fonctionne");
    return result.lastID;
}

export async function createGuestInDB (
    db: Database,
): Promise<number> {

    const alias = generateRandomAlias(db);
    
    const result = await db.run(`
        INSERT INTO USERS (alias)
        VALUES (?)`,
        [alias]
    );

    if (!result.lastID) 
    {
        throw new Error('Failed to create new user');
    }

    console.log("createGuestinDB fonctionne");
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

export async function findEmailById (
    db: Database,
    user_id: number
): Promise<string>
{
    const email = await db.get(`
        SELECT email FROM USERS WHERE id = ?`,
        [user_id]
    );

    return email.email;
}

export async function isAliasUsed (
    db: Database,
    alias: string
): Promise<boolean>
{
    const checkAlias = await db.get(`
        SELECT id FROM USERS WHERE alias = ?`,
        [alias]
    );

    if (checkAlias?.id)
        return true;

    return false;
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

    console.log(`bio length = ${bio.length}`);
    if (bio.length > 75)
        throw new Error(`Error: bio too long. Max 75 characters`);

    // console.log("update bio dans users.ts");
    await db.run(`
        UPDATE USERS SET bio = ? WHERE id = ?`,
        [bio, user_id]
    );
}

export async function updateTheme (
    db: Database,
    userId: number,
    theme: string
)
{
    const user = await findUserByID(db, userId);
    if (!user?.id)
        throw new Error(`Error id: ${userId} does not exist`);

    await db.run(`
        UPDATE USERS SET theme = ? WHERE id = ?`,
        [theme, userId]
    );
}

// export async function updateEmail (
//     db: Database,
//     user_id: number,
//     email: string
// )
// {
//     const user = await findUserByID(db, user_id);
//     if (!user?.id)
//         throw new Error(`Error id: ${user_id} does not exist`);

//     const emailAlreadyUsed = await db.get(`
//         SELECT * FROM USERS WHERE email = ?`,
//         [email]
//     )
//     if (emailAlreadyUsed)
//         throw new Error(`This email is already taken`)

//     await db.run(`
//         UPDATE USERS SET email = ? WHERE id = ?`,
//         [email, user_id]
//     );
// }

// export async function rollbackChangeEmail (
//     db: Database,
//     user_id: number,
//     email: string
// )
// {
//     await db.run(`
//         UPDATE USERS SET email = ? WHERE id = ?`,
//         [email, user_id]
//     );
// }


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


// update de l'avatar

export async function updateAvatar(
    db: Database,
    user_id: number,
    avatar_url: string
) {
    const user = await findUserByID(db, user_id);
    if (!user?.id)
        throw new Error(`Error id: ${user_id} does not exist`);

    await db.run(
        `UPDATE USERS SET avatar_url = ? WHERE id = ?`,
        [avatar_url, user_id]
    );
}

// update de l'username

export async function updateAlias (
    db: Database,
    user_id: number,
    alias: string
)
{
    const user = await findUserByID(db, user_id);
    if (!user?.id)
        throw new Error(`Error id: ${user_id} does not exist`);

    if (alias.length > 30)
        throw new Error(`Error: alias too long. Max 30 characters`);

    const existingUser = await db.get(`
        SELECT id FROM USERS WHERE alias = ? AND id != ?`,
        [alias, user_id]
    );

    if (existingUser)
        throw new Error('Alias already taken, be original.');

    console.log("update username dans users.ts");
    await db.run(`
        UPDATE USERS SET alias = ? WHERE id = ?`,
        [alias, user_id]
    );
}