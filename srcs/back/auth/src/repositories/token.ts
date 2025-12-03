import { Database } from 'sqlite';

//-------- TYPE
export interface Token {
    id: number,
    user_id: number;
    credential_id: number,
    refresh_token: string,
    expires_at: Date
}

export interface CreateTokenData {
    user_id: number;
    credential_id: number,
    refresh_token: string,
    expires_at: Date,
}

//-------- POST / CREATE
export async function createToken(
    db: Database, 
    data: CreateTokenData
): Promise<undefined> { 
    const result = await db.run(`
        INSERT INTO TOKENS (user_id, credential_id, refresh_token, expires_at)
        VALUES (?, ?, ?, ?)`,
        [data.user_id, data.credential_id, data.refresh_token, data.expires_at]
    );

    if (!result.lastID) {
        throw new Error('Failed to create a token');
    }

    return ;
}

//-------- PUT / UPDATE
export async function updateToken(
    db: Database,
    credential_id: number,
    refresh_token: string,
    expires_at: Date
){
    await db.run(`
        UPDATE TOKENS SET refresh_token = ?, expires_at = ? WHERE credential_id = ?`,
        [refresh_token, expires_at, credential_id]
    );
}

//-------- GET / READ
export async function findByRefreshToken(
    db: Database,
    token: string
): Promise<Token | undefined> {
    const result = await db.get(`
        SELECT * FROM TOKENS WHERE refresh_token = ?`,
    [token]
    );
    return result;
}
