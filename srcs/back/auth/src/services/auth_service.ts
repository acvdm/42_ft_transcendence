import * as credRepo from "../repositories/credentials.js";
import * as tokenRepo from '../repositories/token.js';
import * as crypt from '../utils/crypto.js'
import { Secret, TOTP } from 'otpauth'; // Time-based One-Time Password
import * as QRCode from 'qrcode';

import { 
    generate2FASecret,
    generateAccessToken, 
    generateRefreshToken, 
    hashPassword,
    generateTempToken 
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

//   /!\   NOUVEAU TYPE DE RETOUR POSSIBLE  /!\ 
export interface LoginResponse {
	// Cas classique
	access_token?: string;
	refresh_token?: string;
	user_id?: number;

	// Cas 2FA requis
	require_2fa?: boolean;
	temp_token?: string; // Token temporaire special donne pour entrer le code de verification
}

export interface TwoFAGenerateResponse {
    qrCodeUrl: string; // image en base64
    manualSecret: string; // code texte au cas ou la camera ne marche pas
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
): Promise<authResponse> 
{
    // 1. Vérification que l'email n'est pas déjà pris
    const existing = await credRepo.findByEmail(db, email);
    if (existing)
        throw new Error('Email already in use');

    // 2. Hashage, génération 2fa
    const pwd_hashed = await hashPassword(password);

    // 3. Insertion DB
    const credential_id = await credRepo.createCredentials(db, {
        user_id,
        email,
        pwd_hashed,
        two_fa_secret: null,
        is_2fa_enabled: 0
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

    await credRepo.changeEmail(db, user_id, email);
}

///////////// RAJOUTER PAR FAUSTINE

export async function changePasswordInCredential (
    db: Database,
    credentialId: number,
    newPwd1: string,
): Promise<void> 
{

    const newHashedPwd = await crypt.hashPassword(newPwd1);

    await credRepo.changePwd(db, credentialId, newHashedPwd);
}

///////////// RAJOUTER PAR FAUSTINE



export async function loginUser(
    db: Database,
    email: string, 
    password: string
): Promise<LoginResponse> 
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

    // VERIFIER SI 2FA ENABLE
    const is2FA = await credRepo.is2FAEnabled(db, user_id);

    // 2FA active -> on ne donne pas les acces (refresk/access token) mais un tocken temporaire pour acceder a la page pour entrer le num
    if (is2FA) {
        const tempToken = generateTempToken(user_id); // dans crypt, duree 5min

        return {
            require_2fa: true,
            temp_token: tempToken
        };
    }

    // 2FA desactive
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

// JWT pour refresh le refresh et l'access token

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

// 2FA verification
// fonction qui prend le code a 6 chiffres envoye par l'utilisateur 
// et verifie s'il matche avec le secret en base
// permet d'active le 2FA pour le profil de l'utilisateur

export async function verifyAndEnable2FA(
    db: Database,
    userId: number,
    token: string // code envoye par lutilisateur
) : Promise<boolean> {

    // 1. Recuperer le secret en DB
    const secretStr = await credRepo.get2FASecret(db, userId);
    if (!secretStr)
        throw new Error("2FA not initiated");

    // 2. Creer l'objet TOTP pour verifier
    const totp = new TOTP({
        issuer: "Transcendence",
        label: "Transcendence", 
        algorithm: "SHA1", // fonction qui melange le secret et l'heure
        digits: 6, // code final a 6 chiffres
        period: 30, // code change toutes les 30 secondes
        secret: Secret.fromBase32(secretStr) // Reconvertir la string en objet Secret (il avait ete convertie en string pour etre mise en DB)
    }); 

    // 3. Valider le code
    // delta renvoit l'ecart de temps (0 = parfait, -1 = code d'il y a 30s, null = invalide)
    const delta = totp.validate({ token, window: 1}); // window = marge d'erreur -> serveur accepte le code actuel mais regarde aussi 1 periode avant et apres
    if (delta === null) {
        return false;
    }

    await credRepo.activate2FA(db, userId);
    
    return true;
};

// finalizeLogin
// verifie le code entre au moment du login
// si ok -> genere les vrais tokens
// enregistre le refresh token en BDD

export async function finalizeLogin2FA(
    db: Database, 
    userId: number, 
    code: string
): Promise<authResponse | null> // renvoit null si le code est invalide
{
    // 1. recuperer le secret en bdd
    const secretStr = await credRepo.get2FASecret(db, userId);
    if (!secretStr)
        throw new Error("2FA not configured for this user");

    // 2. verifier le code totp
    const totp = new TOTP({
        issuer: "Transcendence",
        label: "Transcendence",
        algorithm: "SHA1",
        digits: 6,
        period: 30,
        secret: Secret.fromBase32(secretStr)
    });

    const delta = totp.validate({ token: code, window: 1});

    if (delta === null) {
        return null;
    }

    // a partir d'ici --> login reussi

    // 3. recuperer le credential id necessaire pour la table TOKENS
    const credential = await credRepo.getCredentialbyUserID(db, userId);
    if (!credential)
        throw new Error("Credential not found");


    // 4. generer les vrais tokens (access + refresh)
    const tokens = await generateTokens(userId, credential.id);

    // 5. nettoyage : on supprime les vieux tokens de cet utilisateur
    await tokenRepo.deleteTokenByCredentialId(db, credential.id);

    // 6. sauvegarde: on enregistre le nouveau refresh token
    await tokenRepo.createToken(db, {
        user_id: userId,
        credential_id: credential.id,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expires_at
    });

    return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user_id: userId
    };
}