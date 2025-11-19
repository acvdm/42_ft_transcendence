import { 
    createCredentials, 
    findByEmail, 
    findById 
} from "../repositories/credentials.js";
import { createToken } from "../repositories/token.js";

import { 
    generate2FASecret, 
    generateRefreshToken, 
    hashPassword 
} from "../utils/crypto.js";

import { getExpirationDate } from "../utils/date.js";
import { Database } from 'sqlite';

export async function registerUser(
    db: Database,
    user_id: number, 
    email: string, 
    password: string
) {
    // 1. Vérification que l'email n'est pas déjà pris
    const existing = await findByEmail(db, email);
    if (existing)
        throw new Error('Email already in use');

    // 2. Hashage, génération 2fa
    const pwd_hashed = await hashPassword(password);
    const two_fa_secret = generate2FASecret();

    // 3. Insertion DB
    const credential_id = await createCredentials(db, {
        user_id,
        email,
        pwd_hashed,
        two_fa_secret,
        is_2fa_enabled: 1
    });

    // 4. Génération token
    const refresh_token = generateRefreshToken();
    const expires_at = getExpirationDate(30);

    // 5. Insertion dans la DB tokens
    const insertTokens = await createToken(db, {
        user_id,
        credential_id, 
        refresh_token,
        expires_at
    })
}