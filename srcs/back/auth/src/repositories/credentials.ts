import { Database } from 'sqlite';
import { verifyPassword } from '../utils/crypto';

//-------- TYPE
export interface Credential {
    id: number;
    user_id: number;
    email: string;
    pwd_hashed: string;
    two_fa_secret: string | null;
    is_2fa_enabled: number;
    created_at: string;
}

export interface createCredentialData {
    user_id: number;
    email: string;
    pwd_hashed: string;
    two_fa_secret: string | null;
    is_2fa_enabled: number;
}


//-------- POST / CREATE
export async function createCredentials(
    db: Database, 
    data: createCredentialData
): Promise<number> 
{
    const result = await db.run(`
        INSERT INTO CREDENTIALS (user_id, email, pwd_hashed, two_fa_secret, is_2fa_enabled)
        VALUES (?, ?, ?, ?, ?)`,
        [data.user_id, data.email, data.pwd_hashed, data.two_fa_secret, 1]
    );

    if (!result.lastID) {
        throw new Error('Failed to create credential');
    }

    return result.lastID;
}

//-------- GET / READ
// Attention on n'envoie jamais le mdp hashé
export async function findByEmail(
    db: Database, 
    email: string
): Promise<number | undefined> 
{
    const result = await db.get(`
        SELECT id FROM CREDENTIALS WHERE email = ?`,
        [email]
    );

    return result?.id;
}

export async function findUserIdByEmail (
    db: Database,
    email: string
): Promise<number | undefined> 
{
    const result = await db.get(`
        SELECT user_id FROM CREDENTIALS WHERE email = ?`,
        [email]
    );

    return result?.user_id;
}

export async function findById(
    db: Database,
    id: number
): Promise<Credential | undefined> 
{
    return await db.get(`
        SELECT user_id, email, is_2fa_enabled, created_at FROM CREDENTIALS WHERE id = ?`,
        [id]
    );
}

export async function getCredentialbyID(
    db: Database,
    credential_id: number
): Promise<Credential | undefined> 
{
    const credential = await db.get(`
        SELECT * FROM CREDENTIALS WHERE id = ?`,
        [credential_id]
    );
    console.log(`test: ${credential?.id}`);

    return credential;
}

export async function getEmailbyID(
    db: Database,
    user_id: number
) : Promise<string | undefined> 
{
    const row = await db.get(`
        SELECT email FROM CREDENTIALS WHERE id = ?`,
        [user_id]
    );
    return row?.email;
}

export async function get2FASecret(
    db: Database, 
    user_id: number
): Promise<string | null> 
{
    const row = await db.get(
        `SELECT two_fa_secret FROM CREDENTIALS WHERE user_id = ?`,
        [user_id]
    );
    return row?.two_fa_secret || null;
}

//-------- PUT / UPDATE

// sauvegarde le secret mais laisse le 2FA desactive
export async function update2FASecret(
    db: Database,
    user_id: number,
    secret: string
) : Promise<void> 
{
    await db.run(
        `UPDATE CREDENTIALS
        SET two_fa_secret = ?, is_2fa_enabled = 0
        WHERE user_id = ?`,
        [secret, user_id]
    );
}

export async function changeEmail (
    db: Database,
    user_id: number,
    email: string
)
{ // MODIFICATION 'FROM' enleve Sqlite naime pas FROM dans un UPDATE
    await db.run(`
        UPDATE CREDENTIALS SET email = ? WHERE user_id = ?`,
        [email, user_id]
    );
}

// active le 2FA en DB (passe a true)
export async function activate2FA(
    db: Database, 
    user_id: number
): Promise<void> 
{
    await db.run(
        `UPDATE CREDENTIALS SET is_2fa_enabled = 1 WHERE user_id = ?`,
        [user_id]
    );
}

export async function disable2FA(
    db: Database,
    user_id: number
): Promise<void>
{
    await db.run(
        `UPDATE CREDENTIALS
        SET is_2fa_enabled = 0, two_fa_secret = NULL
        WHERE user_id = ?`,
        [user_id]
    );
}


//-------- DELETE / DELETE
    