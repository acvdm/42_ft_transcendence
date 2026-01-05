import { Database } from 'sqlite';
import { verifyPassword } from '../utils/crypto.js';

//-------- TYPE
export interface Credential {
    id: number;
    userId: number;
    email: string;
    pwdHashed: string;
    twoFaSecret: string | null;
    twoFaMethod: string;
    emailOtp: string | null;
    emailOtpExpiresAt: string | null; 
    createdAt: string;
}

export interface createCredentialData {
    userId: number;
    email: string;
    pwdHashed: string;
    twoFaSecret: string | null;
    twoFaMethod: string;
    emailOtp: string | null;
    emailOtpExpiresAt: string | null; 
}


//-------- POST / CREATE
export async function createCredentials(
    db: Database, 
    data: createCredentialData
): Promise<number> 
{
    const result = await db.run(`
        INSERT INTO CREDENTIALS (user_id, email, pwd_hashed, two_fa_secret, two_fa_method, email_otp, email_otp_expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [data.userId, data.email, data.pwdHashed, data.twoFaSecret, 'NONE', data.emailOtp, data.emailOtpExpiresAt ]
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
        SELECT user_id, email, two_fa_method, created_at FROM CREDENTIALS WHERE id = ?`,
        [id]
    );
}

export async function getCredentialbyID(
    db: Database,
    credentialId: number
): Promise<Credential | undefined> 
{
    const credential = await db.get(`
        SELECT 
            id,
            user_id AS userId,
            email,
            pwd_hashed AS pwdHashed,
            two_fa_secret AS twoFaSecret,
            two_fa_method AS twoFaMethod,
            email_otp AS emailOtp,
            email_otp_expires_at AS emailOtpExpiresAt,
            created_at AS createdAt 
        FROM CREDENTIALS 
        WHERE id = ?`,
        [credentialId]
    );
    console.log(`test: ${credential?.id}`);

    return credential;
}

export async function getCredentialbyUserID(
    db: Database,
    userId: number
): Promise<Credential | undefined> 
{
    const credential = await db.get(`
        SELECT 
            id,
            user_id AS userId,
            email,
            pwd_hashed AS pwdHashed,
            two_fa_secret AS twoFaSecret,
            two_fa_method AS twoFaMethod,
            email_otp AS emailOtp,
            email_otp_expires_at AS emailOtpExpiresAt,
            created_at AS createdAt 
        FROM CREDENTIALS 
        WHERE user_id = ?`,
        [userId]
    );
    return credential;
}

export async function getEmailbyID(
    db: Database,
    userId: number
) : Promise<string | undefined> 
{
    const row = await db.get(`
        SELECT email FROM CREDENTIALS WHERE user_id = ?`,
        [userId]
    );
    return row?.email;
}

export async function get2FASecret(
    db: Database, 
    userId: number
): Promise<string | null> 
{
    const row = await db.get(`
        SELECT two_fa_secret FROM CREDENTIALS WHERE user_id = ?`,
        [userId]
    );
    return row?.two_fa_secret || null;
}

export async function get2FAMethod(
    db: Database,
    userId: number
): Promise<'NONE' | 'APP' | 'EMAIL'>
{
    const row = await db.get(`
        SELECT two_fa_method FROM CREDENTIALS WHERE user_id = ?`,
        [userId]
    );
    return row?.two_fa_method || 'NONE';
}

export async function getEmailCodeData(
    db: Database,
    userId: number
): Promise<{ code: string | null, expiresAt: string | null }>
{
    const row = await db.get(`
        SELECT email_otp, email_otp_expires_at FROM CREDENTIALS WHERE user_id = ?`,
        [userId]
    );
    return {
        code: row?.email_otp || null,
        expiresAt: row?.email_otp_expires_at || null
    }
}

export async function getAuthDataForExport(
    db: Database,
    userId: number
) : Promise<{ email: string, createdAt: string, twoFaMethod: string, id: number } | undefined >
{
    const row = await db.get(`
        SELECT created_at, two_fa_method, email FROM CREDENTIALS WHERE user_id = ?`,
        [userId]
    );
    if (!row)
        return undefined;

    return {
        email: row.email,
        createdAt: row.created_at,
        twoFaMethod: row.two_fa_method,
        id: userId
    }
}

/* MODIFIER LA METHODE POUR RECUP NONE APP OU EMAIL */
// export async function is2FAEnabled(
//     db: Database,
//     user_id: number
// ): Promise<boolean>
// {
//     const row = await db.get(`
//         SELECT is_2fa_enabled FROM CREDENTIALS WHERE user_id = ?`,
//         [user_id]
//     );
//     return row?.is_2fa_enabled === 1;
// }

//-------- PUT / UPDATE

// sauvegarde le secret mais laisse le 2FA desactive
export async function update2FASecret(
    db: Database,
    user_id: number,
    secret: string
) : Promise<void> 
{
    await db.run(`
        UPDATE CREDENTIALS
        SET two_fa_secret = ?, two_fa_method = ?
        WHERE user_id = ?`,
        [secret, 'NONE', user_id]
    );/* MODIFIER two_fa_method */
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


////////////// RAJOUTER PAR FAUSTINE

export async function changePwd (
    db: Database,
    credentialId: number,
    newHashedPwd: string
)
{ // MODIFICATION 'FROM' enleve Sqlite naime pas FROM dans un UPDATE
    await db.run(
        'UPDATE credentials SET pwd_hashed = ? WHERE id = ?',
        [newHashedPwd, credentialId]
    );
}

export async function set2FAMethod(
    db: Database, 
    user_id: number,
    method: 'APP' | 'EMAIL' | 'NONE'
): Promise<void> 
{
    await db.run(
        `UPDATE CREDENTIALS SET two_fa_method = ? WHERE user_id = ?`,
        [method, user_id]
    );
}

export async function saveEmailCode(
    db: Database, 
    user_id: number,
    code: string,
    expiration: Date
): Promise<void> 
{
    await db.run(
        `UPDATE CREDENTIALS SET email_otp = ?, email_otp_expires_at = ? WHERE user_id = ?`,
        [code, expiration.toISOString(), user_id]
    );
}

// active le 2FA en DB (passe a true)
/* MODIFIER POUR two_fa_method */
// export async function activate2FA(
//     db: Database, 
//     user_id: number
// ): Promise<void> 
// {
//     await db.run(
//         `UPDATE CREDENTIALS SET is_2fa_enabled = 1 WHERE user_id = ?`,
//         [user_id]
//     );
// }



//-------- DELETE / DELETE

export async function clearEmailCode(
    db: Database, 
    user_id: number
): Promise<void> 
{
    await db.run(
        `UPDATE CREDENTIALS SET email_otp = NULL, email_otp_expires_at = NULL WHERE user_id = ?`,
        [user_id]
    );
}

export async function disable2FA(
    db: Database, 
    user_id: number
): Promise<void> 
{
    await db.run(
        `UPDATE CREDENTIALS SET two_fa_method = 'NONE', two_fa_secret = NULL, email_otp = NULL WHERE user_id = ?`,
        [user_id]
    );
}

export async function deleteCredentialsByUserId(
    db: Database,
    userId: number
): Promise<void>
{
    await db.run(
        `DELETE FROM CREDENTIALS WHERE user_id = ?`,
        [userId]
    );
}
