import { Database } from 'sqlite';

export interface Channel {
    id: number,
    channelKey: string
}

export async function findChannelByKey (
    db: Database,
    channelKey: string
): Promise <Channel | undefined>    
{

    console.log("entrée dans findChannelByKey avec channelKey: ", channelKey);
    const channel = await db.get(`
        SELECT * FROM CHANNELS WHERE channel_key = ?`,
        [channelKey]
    );

    if (!channel?.id)
    {
        console.log('channel existe pas');
        return ;
    }
    
    console.log(`channel ${channelKey} existe`);
    return channel;
}

export async function createChannel (
    db: Database,
    channelKey: string
): Promise<number | undefined> 
{
    const result = await db.run(`
        INSERT INTO CHANNELS (channel_key)
        VALUES (?)`,
        [channelKey]
    );

    if (!result.lastID)
        throw new Error('Failed to create new channel');

    console.log(`channel : ${channelKey} créé avec ID: ${result.lastID}`);

    return result.lastID;
}

export async function addEventInChannel (
    db: Database,
    channelKey: string,
    user_id: number
) 
{

}