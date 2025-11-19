import { Database } from 'sqlite';

//-------- TYPE
export interface Token {
    id: number,
    credential_id: number,
    refresh_token: string,
    expires_at: Date
}

export interface CreateTokenData {
    credential_id: number,
    refresh_token: string,
    expires_at: Date,
}


//-------- CREATE
export async function createToken(
    db: Database, 
    data: CreateTokenData
): Promise<number> { 
    const result = await db.run(`
        INSERT INTO TOKENS (credential_id, refresh_token, expires_at)
        VALUES (?, ?, ?)`,
        [data.credential_id, data.refresh_token, data.expires_at]
    );

    if (!result.lastID) {
        throw new Error('Failed to create a token');
    }

    return result.lastID;
}