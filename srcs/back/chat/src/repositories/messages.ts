import { Database } from 'sqlite';
import { findChannelByKey } from './channels.js';
import { ServiceUnavailableError } from '../utils/error.js';

//-------- TYPE
export interface Message {
    msg_id: number;
    sender_id: number;
    sender_alias: string;
    channel_key: string,
    msg_content: string;
    sent_at: string;
}

export interface createMessage {
    sender_id: number;
    msg_content: string;
    channel: string;
}



//-------- POST / CREATE
export async function saveNewMessageinDB(
    db: Database,
    channel_key: string,
    sender_id: number,
    sender_alias: string,
    msg_content: string 
): Promise<number | undefined> 
{
    console.log(`channelKey dans saveNewMessageinDB: ${channel_key}`);
    const channel = await findChannelByKey(db, channel_key);
    if (!channel?.id)
    {
        console.log("channel non trouvé dans saveNewMessage");
        return;
    }
    const channel_id = await channel.id;

    // faustine: ajout de sent at
    const result = await db.run (`
        INSERT INTO MESSAGES (sender_id, sender_alias, msg_content, channel_id, sent_at) 
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [sender_id, sender_alias, msg_content, channel_id]
    );

    if (!result?.lastID)
        throw new ServiceUnavailableError("Table MESSAGES [chat.sqlite]: Could not save message");

    console.log(`message ${result.lastID} saved in ${channel_key}`);
    return result.lastID;
}


export async function createChannel(
    db: Database,
    channel_name: string
): Promise<number> 
{
    const result = await db.run(`
        INSERT INTO CHANNELS (name)
        VALUES (?)`,
        [channel_name]
    );

    if (!result?.lastID)
        throw new ServiceUnavailableError("Tables CHANNELS [chat.sqlite]: could not create new channel");

    return result.lastID;
}


//-------- GET
export async function getHistoryByChannel(
    db: Database,
    channel_id: number
): Promise<Message []>
{
    const messages = await db.all(`
        SELECT msg_id, sender_alias, msg_content, sent_at 
        FROM MESSAGES
        WHERE channel_id = ?
        ORDER BY sent_at ASC`,
        [channel_id]
    ) as Message[];

    // Retourne messages si défini sinon un tableau vide
    return messages || [];
}



//-------- PUT / UPDATE