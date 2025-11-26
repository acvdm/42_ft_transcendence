import { Database } from 'sqlite';

//-------- TYPE
export interface Message {
    msg_id: number;
    sender_id: number;
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
    data: createMessage,
    channel_id: number 
): Promise<number | undefined> 
{
    const result = await db.run (`
        INSERT INTO MESSAGES (sender_id, msg_content, channel_name, channel_id)
        VALUES (?, ?, ?, ?)`,
        [data.sender_id, data.msg_content, data.channel, channel_id]
    );

    if (!result?.lastID)
        throw new Error("Table MESSAGES [chat.sqlite]: Could not save message");
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
        throw new Error("Tables CHANNELS [chat.sqlite]: could not create new channel");

    return result.lastID;
}


export async function saveNewMemberinChannel(
    db: Database,
    channel_id: number,
    user_id: number
): Promise<number | undefined> 
{
    const result = await db.run(`
        INSERT INTO CHANNEL_MEMBERS (channel_id, user_id)
        VALUES (?, ?)`,
        [channel_id, user_id]
    );

    if (!result?.lastID)
        throw new Error("TABLE CHANNEL_MEMBERS [chat.sqlite]: could not add new member into room: " + channel_id);
    return result.lastID;
}


//-------- GET / READ
export async function getChannelByName(
    db: Database,
    channel: string
): Promise<number | null> 
{
    const result = await db.get(`
        SELECT id FROM CHANNELS WHERE name = ?`,
        [channel]
    );

    return result ? result.id : null;
}



//-------- PUT / UPDATE