import { Database } from 'sqlite';
import { User } from './users';

export interface Friendship {
    user_id: number,
    friend_id: number,
    status: string
}

//-------- POST / CREATE
export async function makeFriendshipRequest (
    db: Database,
    user_id: number,
    alias: string
): Promise<{ user_id: number, friend_id: number}>
{
    const friend = await db.get(`
        SELECT * FROM USERS WHERE alias = ?`,
        [alias]
    ) as User;
    if (!friend?.id)
        throw new Error(`Cannot find friend_id with alias ${alias}`);

    const is_blocked = await db.get(`
        SELECT * FROM FRIENDSHIPS WHERE user_id = ? AND friend_id = ? AND status = 'blocked'`,
        [user_id, friend.id]
    );
    if (is_blocked)
        throw new Error('No user found');

    const result = await db.run(`
        INSERT INTO FRIENDSHIPS (user_id, friend_id)
        VALUES (?, ?)`,
        [user_id, friend.id]
    );

    if (!result || result.changes !== 1)
    {
        throw new Error(`Error while sending friendship request from ${user_id} to ${friend.id}`);
    }

    return { user_id, friend_id: friend.id };
}

//-------- GET / READ
// export async function listFriends (
//     db: Database,
//     user_id: number
// ): Promise<User []>
// {
//     const users = await db.all(`
//         SELECT * FROM FRIENDSHIPS WHERE id = ? AND status = 'validated'`,
//         [user_id]
//     ) as User[];

//     return users || [];
// }

//-------- GET / READ
export async function listFriends (
    db: Database,
    user_id: number
): Promise<User []>
{
    console.log(`Lister les amis de user ${user_id}`);
    // On sélectionne TOUTES les colonnes de la table USERS (u.*)
    // En joignant la table FRIENDSHIPS (f) avec la table USERS (u)
    // Condition : On cherche les lignes où JE suis le créateur du lien (f.user_id = moi)
    const users = await db.all(`
        SELECT u.* FROM FRIENDSHIPS f
        JOIN USERS u ON (
            (f.user_id = ? AND f.user_id = u.id)
            OR
            (f.friend_id = ? AND f.friend_id = u.id)
        )
        WHERE f.status = 'validated'`,
        [user_id, user_id]
    ) as User[];

    return users || [];
}

export async function listRequests (
    db: Database,
    user_id: number
): Promise<User []>
{
    const pending_requests = await db.all(`
        SELECT u.* FROM FRIENDSHIPS f
        JOIN USERS u ON f.user_id = u.id
        WHERE f.friend_id = ? AND f.status = 'pending'`,
        [user_id]
    ) as User[];

    return pending_requests || [];
}

//-------- PUT / UPDATE
export async function reviewFriendshipRequest (
    db: Database,
    user_id: number,
    friendship_id: number,
    status: string
)
{
    await db.run(`
        UPDATE FRIENDSHIPS SET status = ? WHERE friend_id = ? AND id = ?`,
        [status, user_id, friendship_id]
    );
}

//-------- DELETE / DELETE