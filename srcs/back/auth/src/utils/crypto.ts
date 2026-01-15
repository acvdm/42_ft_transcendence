import jwt from 'jsonwebtoken'; // pour .sign() et .verify()
import argon2 from 'argon2'; // algo hachage de mdp
import { randomBytes, randomInt } from 'crypto'; // generateur de hasard .hash() .verify() comparaison mdp et hash
import { Secret, TOTP } from 'otpauth'; // 2FA
import * as QRCode from 'qrcode';
import * as tokenRepo from '../repositories/token.js';
import * as credRepo from '../repositories/credentials.js';

// usine de fabrication --> ne touche pas a la bdd mais genere des chaines de caracteres, etc

export interface TwoFAGenerateResponse {
    qrCodeUrl: string; // image en base64
    manualSecret: string; // code texte au cas ou la camera ne marche pas
}

// recuperation de la var d'env qui servira a hasher le jwt
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET){
    console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
    process.exit(1);
}

// PASSWORD
export async function hashPassword(password: string): Promise<string> {
    try {
        const hash = await argon2.hash(password);
        return (hash);
    } catch (err) {
        throw new Error('Password hashing failed');
    }    
}

export async function verifyPassword(
    password: string, 
    pwd_hashed: string
): Promise <boolean> 
{
    return await argon2.verify(pwd_hashed, password);
}

// Module JWT
// Access Token : Signe avec le secret du .env
export function generateAccessToken(userId: number, credential_id: number): string {
    const payload = {
        sub: userId,
        cred_id: credential_id
    };
    return jwt.sign(payload, JWT_SECRET!, { expiresIn: '4m'});
}

// Refresh Token : comme un pointeur vers la bdd (conserve en securite au niveau du cookie)
// pour eviter le probleme de token non supprim´ apres suppresion de l'utilisateur
export function generateRefreshToken(user_id: number): string {
    return (randomBytes(32).toString('hex'));
 }

// verification du token
export function verifyAccessToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET!);
    } catch (e) {
        return null;
    }
}

/* 2FA */

export function generateTempToken(
    userId: number 
): string {
    
    const payload = {
        sub: userId,
        scope: '2fa_login', 
    };
    return jwt.sign(payload, JWT_SECRET!, { expiresIn: '5m'});
}

export function generateRandomCode(length: number = 6): string {
    let code = '';
    for (let i = 0; i < length; i++)
        code += randomInt(0, 10).toString();
    return code;
}