import { Database } from 'sqlite';
import { ServiceUnavailableError } from '../utils/error.js';

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
        throw new ServiceUnavailableError('Failed to create new channel');

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