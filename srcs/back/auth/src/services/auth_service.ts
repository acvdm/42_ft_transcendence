import * as credRepo from "../repositories/credentials.js";
import * as tokenRepo from '../repositories/token.js';
import * as crypt from '../utils/crypto.js'

import { 
    generate2FASecret,
    generateAccessToken, 
    generateRefreshToken, 
    hashPassword 
} from "../utils/crypto.js";

import { getExpirationDate } from "../utils/date.js";
import { Database } from 'sqlite';


export interface authResponse {
    access_token: string;
    refresh_token: string;
    user_id: number 
}

export async function registerUser(
    db: Database,
    user_id: number, 
    email: string, 
    password: string
): Promise<authResponse | undefined> 
{
    // 1. Vérification que l'email n'est pas déjà pris
    const existing = await credRepo.findByEmail(db, email);
    if (existing)
        throw new Error('Email already in use');

    // 2. Hashage, génération 2fa
    const pwd_hashed = await hashPassword(password);
    const two_fa_secret = generate2FASecret();

    // 3. Insertion DB
    const credential_id = await credRepo.createCredentials(db, {
        user_id,
        email,
        pwd_hashed,
        two_fa_secret,
        is_2fa_enabled: 1
    });

    // 4. Génération token
    const access_token = generateAccessToken(user_id, credential_id);
    const refresh_token = generateRefreshToken(user_id);
    const expires_at = getExpirationDate(30);

    // 5. Insertion dans la DB tokens
    await tokenRepo.createToken(db, {
        user_id,
        credential_id, 
        refresh_token,
        expires_at
    });

    return {
        access_token,
        refresh_token,
        user_id
    };
}

export async function loginUser(
    db: Database,
    email: string, 
    password: string
): Promise<authResponse | undefined> 
{
    
    const user_id = await credRepo.findUserIdByEmail(db, email);
    if (!user_id)
        throw new Error('No user matches the email');

    const credential_id = await credRepo.findByEmail(db, email);
    if (!credential_id)
        throw new Error('Unknown email');

    const isPasswordValid = await authenticatePassword(db, credential_id, password);
    if (!isPasswordValid)
        throw new Error ('Invalid password');

    const access_token = generateAccessToken(user_id, credential_id);
    const refresh_token = generateRefreshToken(user_id);
    const expires_at = getExpirationDate(30);

    await tokenRepo.updateToken(db, credential_id, refresh_token, expires_at);

    return {
        access_token,
        refresh_token,
        user_id
    };
}

export async function authenticatePassword(
    db: Database,
    credential_id: number,
    password: string
): Promise<boolean> 
{
    const credential =  await credRepo.getCredentialbyID(db, credential_id);
    if (!credential)
        throw new Error("Could not find any matching credential");
    return await crypt.verifyPassword(password, credential.pwd_hashed);
}