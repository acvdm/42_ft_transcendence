import { Database } from 'sqlite';
import { User } from './users.js';

export interface Friendship {
    user_id: number,
    friend_id: number,
    status: string
}

//-------- POST / CREATE
export async function friendshipRequest (
    db: Database,
    user_id: number,
    friend_id: number
): Promise<Number>
{
    const result = await db.run(`
        INSERT INTO FRIENDSHIPS (user_id, friend_id)
        VALUES (?, ?)`,
        [user_id, friend_id]
    );

    if (!result.lastID)
    {
        throw new Error(`Error while sending friendship request from ${user_id} to ${friend_id}`);
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
    friendship_id: number,
    status: string
)
{
    await db.run(`
        UPDATE FRIENDSHIPS SET status = ? WHERE id = ?`,
        [friendship_id, status]
    );
}

//-------- DELETE / DELETE