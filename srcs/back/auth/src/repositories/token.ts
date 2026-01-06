import { Database } from 'sqlite';

//-------- TYPE
export interface Token {
    id: number,
    userId: number;
    credentialId: number,
    refreshToken: string,
    expiresAt: Date
}

export interface CreateTokenData {
    userId: number;
    credentialId: number,
    refreshToken: string,
    expiresAt: Date,
}

//-------- POST / CREATE
export async function createToken(
    db: Database, 
    data: CreateTokenData
): Promise<undefined> 
{ 
    const result = await db.run(`
        INSERT INTO TOKENS (user_id, credential_id, refresh_token, expires_at)
        VALUES (?, ?, ?, ?)`,
        [data.userId, data.credentialId, data.refreshToken, data.expiresAt]
    );

    if (!result.lastID) {
        throw new Error('Failed to create a token');
    }

    return ;
}

//-------- PUT / UPDATE
export async function updateToken(
    db: Database,
    credentialId: number,
    refreshToken: string,
    expiresAt: Date
)
{
    await db.run(`
        UPDATE TOKENS SET refresh_token = ?, expires_at = ? WHERE credential_id = ?`,
        [refreshToken, expiresAt, credentialId]
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

export async function deleteRefreshToken(db: Database, token: string): Promise<void> {
    await db.run(`
        DELETE FROM tokens WHERE refresh_token = ?`, 
        [token]
    );
}

// pour une deconnexion de tous les appareils
export async function deleteAllTokensForUser(db: Database, userId: number): Promise<void> {
    await db.run(`
        DELETE FROM tokens WHERE user_id = ?`, [userId]
    );
}

export async function deleteTokenByCredentialId(db: Database, credentialId: number) : Promise<void> {
    await db.run(`
        DELETE FROM tokens WHERE credential_id = ?`, [credentialId]
    );
}
