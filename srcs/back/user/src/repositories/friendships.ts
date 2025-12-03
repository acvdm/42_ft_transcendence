import { Database } from 'sqlite';
import { User } from './users';

export interface Friendship {
    user_id: number,
    friend_id: number,
    status: string
}

//-------- POST / CREATE
export async function friendshipRequest (
    db: Database,
    user_id: number,
    alias: string
): Promise<Number>
{
    const friend = await db.get(`
        SELECT * FROM USERS WHERE alias = ?`,
        [alias]
    ) as User;
    if (!friend?.id)
        throw new Error(`Cannot find friend_id with alias ${alias}`);

    const is_blocked = await db.get(`
        SELECT * FROM FRIENDSHIPS WHERE user_id = ? AND friend_id = ?`,
        [user_id, friend.id]
    );
    if (is_blocked)
        throw new Error('No user found');

    const result = await db.run(`
        INSERT INTO FRIENDSHIPS (user_id, friend_id)
        VALUES (?, ?)`,
        [user_id, friend.id]
    );

    if (!result.lastID)
    {
        throw new Error(`Error while sending friendship request from ${user_id} to ${friend.id}`);
    }

    return result.lastID;
}

//-------- GET / READ
export async function listFriends (
    db: Database,
    user_id: number
): Promise<User []>
{
    const users = await db.all(`
        SELECT * FROM USERS WHERE id = ? AND status = 'validated'`,
        [user_id]
    ) as User[];

    return users || [];
}


//-------- PUT / UPDATE
export async function reviewFriendship (
    db: Database,
    user_id: number,
    status: string
)
{
    await db.run(`
        UPDATE FRIENDSHIPS SET status = ? WHERE user_id = ?`,
        [status, user_id]
    );
}

//-------- DELETE / DELETE