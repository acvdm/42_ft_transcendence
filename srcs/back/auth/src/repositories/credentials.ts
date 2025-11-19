import { Database } from 'sqlite';

//-------- TYPE
export interface Credential {
    id: number;
    email: string;
    pwd_hashed: string;
    two_fa_secret: string;
    is_2fa_enabled: number;
    created_at: string;
}

export interface createCredentialData {
    email: string;
    pwd_hashed: string;
    two_fa_secret: string;
    is_2fa_enabled: number;
}


//-------- CREATE
export async function createCredentials(
    db: Database, 
    data: createCredentialData
): Promise<number> {
    const result = await db.run(`
        INSERT INTO CREDENTIALS (email, pwd_hashed, two_fa_secret, is_2fa_enabled)
        VALUES (?, ?, ?, ?)`,
        [data.email, data.pwd_hashed, data.two_fa_secret, 1]
    );

    if (!result.lastID) {
        throw new Error('Failed to create credential');
    }

    return result.lastID;
}

//-------- READ
// Attention on n'envoie jamais le mdp hashé
export async function findByEmail(
    db: Database, 
    email: string
): Promise<Credential | undefined> {
    return await db.get(`
        SELECT id, email, is_2fa_enabled, created_at FROM CREDENTIALS WHERE email = ?`,
        [email]
    );
}

export async function findById(
    db: Database,
    id: number
): Promise<Credential | undefined> {
    return await db.get(`
        SELECT id, email, is_2fa_enabled, created_at FROM CREDENTIALS WHERE id = ?`,
    [id]
    );
}

//-------- UPDATE




//-------- DELETE
    