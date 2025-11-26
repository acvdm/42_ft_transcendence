import { Database } from 'sqlite';

//-------- TYPE
export interface Message {
    msg_id: number;
    sender_id: number;
    recv_id: number;
    msg_content: string;
    sent_at: string;
}

export interface createMessage {
    sender_id: number;
    recv_id: number;
    msg_content: string;
}

//-------- POST / CREATE
export async function saveMessageinDB(
    db: Database,
    data: createMessage 
): Promise<number | undefined> {
    const result = await db.run (`
        INSERT INTO MESSAGES (sender_id, recv_id, msg_content)
        VALUES (?, ?, ?)`,
        [data.sender_id, data.recv_id, data.msg_content]
    );

    if (!result?.lastID)
        throw new Error("Database chat.sqlite: Could not save message");
    return result.lastID;
}

//-------- GET / READ


//-------- PUT / UPDATE