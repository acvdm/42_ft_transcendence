import jwt from 'jsonwebtoken'; // pour .sign() et .verify()
import argon2 from 'argon2'; // algo hachage de mdp
import { randomBytes } from 'crypto'; // generateur de hasard .hash() .verify() comparaison mdp et hash
import { Secret, TOTP } from 'otpauth'; // 2FA
import * as QRCode from 'qrcode';
import * as tokenRepo from '../repositories/token.js';
import * as credRepo from '../repositories/credentials.js';
import { Database } from 'sqlite';


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
export function generateAccessToken(user_id: number, credential_id: number): string {
    const payload = {
        sub: user_id,
        cred_id: credential_id
    };
    return jwt.sign(payload, JWT_SECRET!, { expiresIn: '17m'}); // MODIF DE TEST 10s 7m
}

// Refresh Token : comme un pointeur vers la bdd (conserve en securite au niveau du cookie)
// pour eviter le probleme de token non supprim´ apres suppresion de l'utilisateur
export function generateRefreshToken(user_id: number): string {
    return (randomBytes(32).toString('hex'));
 }

// verification du token
export function verifyAccessToken(token: string): any { // revoir si besoin de specifier le type de retour
    try {
        return jwt.verify(token, JWT_SECRET!);
    } catch (e) {
        return null;
    }
}

/* 2FA */

export async function  generate2FASecret(
    db: Database,
    userId: number
): Promise<TwoFAGenerateResponse> {

    // recuperer email (pour lafficher dans google authenticator)
    const email = await credRepo.getEmailbyID(db, userId);
    if (!email) 
        throw new Error("User not found");

    // creer secret
    const secret = new Secret({ size: 20});
    
    // sauvegarder secret en DB (is_2fa_enabled doit rester a 0 ici)
    await credRepo.update2FASecret(db, userId, secret.base32);

    // generer url avec le secret pour l'appli
    const totp = new TOTP({
        issuer: "Transcendence", // etiquette pour lappli
        label: email, //etiquette pour l'appli
        algorithm: "SHA1", // fonction qui melange le secret et l'heure
        digits: 6, // code final a 6 chiffres
        period: 30, // code change toutes les 30 secondes
        secret: secret
    }); // pas de communication par le reseau entre tel et serveur pour verifier le code, ils font chacun le meme calcul

    const otpauth_url = totp.toString();

    // convertir l'url en image qr code (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth_url);

    return {
        qrCodeUrl: qrCodeDataUrl,
        manualSecret: secret.base32
    };
}

export function generateTempToken(
    userId: number 
): string {
    
    const payload = {
        sub: userId,
        scope: '2fa_login', 
    };
    return jwt.sign(payload, JWT_SECRET!, { expiresIn: '5m'});
}

