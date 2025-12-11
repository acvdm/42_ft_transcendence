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


export interface accAndRefTokens {
    access_token: string,
    refresh_token: string,
    expires_at: Date
}

export interface authResponse {
    access_token: string,
    refresh_token: string,
    user_id: number
}

async function generateTokens (
    user_id: number,
    credential_id: number
): Promise<accAndRefTokens>
{
    const access_token = generateAccessToken(user_id, credential_id);
    const refresh_token = generateRefreshToken(user_id);
    const expires_at = getExpirationDate(30);

    return { access_token, refresh_token, expires_at}
}

export async function registerUser(
    db: Database,
    user_id: number, 
    email: string, 
    password: string
): Promise<authResponse> {
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
    const tokens = await generateTokens(user_id, credential_id);

    // 5. Insertion dans la DB tokens
    await tokenRepo.createToken(db, {
        user_id,
        credential_id, 
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at
    });

    return { 
        access_token: tokens.access_token, 
        refresh_token: tokens.refresh_token, 
        user_id 
    };
}

export async function changeEmailInCredential (
    db: Database,
    user_id: number,
    email: string
)
{
    const existing = await credRepo.findByEmail(db, email);
    if (existing)
        throw new Error('Email already in use');

    console.log("email pas deja utilise");
    await credRepo.changeEmail(db, user_id, email);
}

export async function loginUser(
    db: Database,
    email: string, 
    password: string
): Promise<authResponse> {
    
    const user_id = await credRepo.findUserIdByEmail(db, email);
    if (!user_id)
        throw new Error('No user matches the email');

    const credential_id = await credRepo.findByEmail(db, email);
    if (!credential_id)
        throw new Error('Unknown email');

    const isPasswordValid = await authenticatePassword(db, credential_id, password);
    if (!isPasswordValid)
        throw new Error ('Invalid password');

    const tokens = await generateTokens(user_id, credential_id);
    // await tokenRepo.updateToken(db, credential_id, tokens.refresh_token, tokens.expires_at);

    // on delete l'ancien token
    await tokenRepo.deleteTokenByCredentialId(db, credential_id);

    // on cree une nouvelle ligne
    await tokenRepo.createToken(db, {
        user_id,
        credential_id,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at
    })

    return { 
        access_token: tokens.access_token, 
        refresh_token: tokens.refresh_token, 
        user_id: user_id 
    };
}

export async function logoutUser(db: Database, refreshToken: string): Promise<void>{
    await tokenRepo.deleteRefreshToken(db, refreshToken);
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

// pour refresh le refresh et l'access token
export async function refreshUser(
    db: Database,
    oldRefreshToken: string
): Promise<authResponse> {

    // chercher le token en DB
    const tokenRecord = await tokenRepo.findByRefreshToken(db, oldRefreshToken);
    if (!tokenRecord){
        throw new Error('Refresh token not found');
    }

    // verification expiration
    const now = new Date();
    const expiry = new Date(tokenRecord.expires_at); // comparaison de string

    if (now > expiry){
        throw new Error('Refresh token expired');
    }

    // generation de nv secrets et des tokens
    const newAccessToken = generateAccessToken(tokenRecord.user_id, tokenRecord.credential_id);
    const newRefreshToken = generateRefreshToken(tokenRecord.user_id);
    const newExpiresAt = getExpirationDate(7);

    // mise a jour de la DB
    await tokenRepo.updateToken(db, tokenRecord.credential_id, newRefreshToken, newExpiresAt);

    return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        user_id:tokenRecord.user_id
    };
}