import { Database } from 'sqlite';

export interface Channel {
    id: number,
    channel_key: string
}

export async function findChannelByKey (
    db: Database,
    channelKey: string
): Promise <Channel | undefined>    
{
    const channel = await db.get(`
        SELECT * FROM CHANNELS WHERE channel_key = ?`,
        [channelKey]
    );

    if (!channel?.id)
        return ;
    
    return channel;
}

export async function createChannel (
    db: Database,
    channelKey: number
): Promise<number | undefined> 
{
    const result = await db.run(`
        INSERT INTO CHANNELS (channel_key)
        VALUES (?)`,
        [channelKey]
    );

    if (!result.lastID)
        throw new Error('Failed to create new channel');

    return result.lastID;
}