import { Database } from 'sqlite';
import { User } from './users';
import { NotFoundError, ValidationError, ConflictError, ForbiddenError, ServiceUnavailableError } from '../utils/error.js';

export interface Friendship {
    id: number,
    user_id: number,
    friend_id: number,
    status: string,
    user?: User,
    friend?: User
}


//-------- POST / CREATE
export async function makeFriendshipRequest (
    db: Database,
    user_id: number,
    alias: string
): Promise<Friendship>
{
    const friend = await db.get(`
        SELECT *,
            CASE WHEN is_guest = 1 THEN 'true' ELSE 'false' END as is_guest_bool
        FROM USERS 
        WHERE alias = ?`,
        [alias]
    ) as User & { is_guest_bool: string };
    if (!friend?.id)
        throw new NotFoundError('friendship_error.cannot_find');

    console.log(`${friend.alias} is guest ? ${friend.is_guest_bool}`);

    if (friend.is_guest_bool === "true")
        throw new ForbiddenError('friendship_error.guest');

    if (friend.id == user_id)
        throw new ValidationError('friendship_error.yourself');

    console.log("line 38");
    const is_blocked = await db.get(`
        SELECT * FROM FRIENDSHIPS WHERE user_id = ? AND friend_id = ? AND status = 'blocked'`,
        [user_id, friend.id]
    );
    if (is_blocked)
        throw new NotFoundError('friendship_error.cannot_find');

    const already_friends = await db.get(`
        SELECT * FROM FRIENDSHIPS 
        WHERE 
            status = 'validated'
            AND (
                (user_id = ? AND friend_id = ?)
                OR
                (user_id = ? AND friend_id = ?)
            )`,
        [user_id, friend.id, friend.id, user_id]
    );
    if (already_friends)
        throw new ConflictError('friendship_error.already_friend');

    const request_already_sent = await db.get(`
       SELECT * FROM FRIENDSHIPS WHERE user_id = ? AND friend_id = ? AND status = 'pending'`,
       [user_id, friend.id]
    );
    if (request_already_sent)
        throw new ConflictError('friendship_error.already_send');

    const result = await db.run(`
        INSERT INTO FRIENDSHIPS (user_id, friend_id)
        VALUES (?, ?)`,
        [user_id, friend.id]
    );

    if (!result || result.changes !== 1)
    {
        throw new ServiceUnavailableError('friendship_error.sending');
    }

    const friendshipId = result.lastID;
    const friendship = await db.get(`
        SELECT * FROM FRIENDSHIPS WHERE id = ?`,
        [friendshipId]
    ) as Friendship;

    const user = await db.get(`
        SELECT * FROM USERS WHERE id = ?`,
        [user_id]
    );

    friendship.user = user;
    friendship.friend = friend;

    return friendship;
}

//-------- GET / READ
export async function listFriends (
    db: Database,
    user_id: number
): Promise<Friendship []>
{
    console.log(`Lister les amis de user ${user_id}`);
    const rows = await db.all(`
        SELECT 
            f.id AS friendship_id,
            f.user_id AS user_id,
            f.friend_id AS friend_id,
            f.status AS status,
            
            u.id AS requester_id,
            u.alias AS requester_alias,
            u.avatar_url AS requester_avatar,
            u.bio AS requester_bio,
            u.theme AS requester_theme,
            u.status AS requester_status,

            r.id AS receiver_id,
            r.alias AS receiver_alias,
            r.avatar_url AS receiver_avatar,
            r.bio AS receiver_bio,
            r.theme AS receiver_theme,
            r.status AS receiver_status

        FROM FRIENDSHIPS f
        JOIN USERS u ON f.user_id = u.id
        JOIN USERS r ON f.friend_id = r.id
        WHERE (f.user_id = ? OR f.friend_id = ?)
          AND f.status = 'validated'`, 
        [user_id, user_id]);

    if (!rows || rows.length === 0)
        return [];

    return rows.map((row:any) =>
    {
        console.log("Row friendhsip id:", row.friendship_id);
        const requester: User =
        {
            id: row.requester_id,
            alias: row.requester_alias,
            avatar_url: row.requester_avatar,
            bio: row.requester_bio,
            theme: row.requester_theme,
            status: row.requester_status,
        };

        const receiver: User =
        {
            id: row.receiver_id,
            alias: row.receiver_alias,
            avatar_url: row.receiver_avatar,
            bio: row.receiver_bio,
            theme: row.receiver_theme,
            status: row.receiver_status,
        };

        const friendship: Friendship =
        {
            id: row.friendship_id,
            user_id: requester.id,
            friend_id: receiver.id,
            status: row.status,
            user: requester,
            friend: receiver
        };

        return friendship;
    });    
}


export async function listRequests(
    db: Database,
    user_id: number
): Promise<Friendship[]> 
{
    const rows = await db.all(`
        SELECT 
            f.id AS friendship_id,
            f.user_id AS user_id,
            f.friend_id AS friend_id,
            f.status AS status,
            
            u.id AS requester_id,
            u.alias AS requester_alias,
            u.avatar_url AS requester_avatar,
            u.bio AS requester_bio,
            u.theme AS requester_theme,
            u.status AS requester_status,

            r.id AS receiver_id,
            r.alias AS receiver_alias,
            r.avatar_url AS receiver_avatar,
            r.bio AS receiver_bio,
            r.theme AS receiver_theme,
            r.status AS receiver_status

        FROM FRIENDSHIPS f
        JOIN USERS u ON f.user_id = u.id
        JOIN USERS r ON f.friend_id = r.id
        WHERE f.friend_id = ?
          AND f.status = 'pending'`, 
        [user_id]);

    if (!rows || rows.length === 0)
        return [];

    return rows.map((row:any) =>
    {
        console.log("Row friendhsip id:", row.friendship_id);
        const requester: User =
        {
            id: row.requester_id,
            alias: row.requester_alias,
            avatar_url: row.requester_avatar,
            bio: row.requester_bio,
            theme: row.requester_theme,
            status: row.requester_status,
        };

        const receiver: User =
        {
            id: row.receiver_id,
            alias: row.receiver_alias,
            avatar_url: row.receiver_avatar,
            bio: row.receiver_bio,
            theme: row.receiver_theme,
            status: row.receiver_status,
        };

        const friendship: Friendship =
        {
            id: row.friendship_id,
            user_id: requester.id,
            friend_id: receiver.id,
            status: row.status,
            user: requester,
            friend: receiver
        };

        return friendship;
    });    
}


//-------- PUT / UPDATE
export async function reviewFriendshipRequest (
    db: Database,
    user_id: number,
    friendship_id: number,
    status: string
)
{
    const allowedStatuses = ['pending', 'validated', 'rejected', 'blocked', 'deleted'];
    if (!allowedStatuses.includes(status))
    {
        throw new ValidationError(`Invalid status: ${status}`);
    }
    
    await db.run(`
        UPDATE FRIENDSHIPS
        SET status = ? 
        WHERE id = ? AND (user_id = ? OR friend_id = ?)`,
        [status, friendship_id, user_id, user_id]
    );
}

export async function markFriendshipsAsDeleted (
    db: Database,
    userId: number
)
{
    await db.run(`
       UPDATE FRIENDSHIPS
       SET status = 'deleted'
       WHERE user_id = ? OR friend_id = ?`,
       [userId, userId]
    );
}


//-------- DELETE / DELETE

export async function deleteAllFriendships (
    db: Database,
    userId: number
): Promise<void>
{
    await db.run(`
        DELETE FROM FRIENDSHIPS
        WHERE user_id = ? OR friend_id = ?`,
        [userId, userId]
    );
}