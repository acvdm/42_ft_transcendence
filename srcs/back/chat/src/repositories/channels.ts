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

    console.log("entrée dans findChannelByKey avec channel_key: ", channelKey);
    const channel = await db.get(`
        SELECT * FROM CHANNELS WHERE channel_key = ?`,
        [channelKey]
    );

    if (!channel?.id)
    {
        console.log('channel existe pas');
        return ;
    }
    
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