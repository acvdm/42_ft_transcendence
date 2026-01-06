import * as credRepo from "../repositories/credentials.js";
import * as tokenRepo from '../repositories/token.js';
import * as crypt from '../utils/crypto.js';
import { Secret, TOTP } from 'otpauth'; // Time-based One-Time Password
import * as QRCode from 'qrcode';
import { send2FAEmail } from "../utils/mailer.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../utils/error.js";

import { 
    generateAccessToken, 
    generateRefreshToken, 
    hashPassword,
    generateTempToken 
} from "../utils/crypto.js";

import { getExpirationDate } from "../utils/date.js";
import { Database } from 'sqlite';


export interface accAndRefTokens {
    accessToken: string,
    refreshToken: string,
    expiresAt: Date
}

export interface authResponse {
    accessToken: string,
    refreshToken: string,
    userId: number
}

//   /!\   NOUVEAU TYPE DE RETOUR POSSIBLE  /!\ 
export interface LoginResponse {
	// Cas classique
	accessToken?: string;
	refreshToken?: string;
	userId?: number;

	// Cas 2FA requis
	require2fa?: boolean;
	tempToken?: string; // Token temporaire special donne pour entrer le code de verification
}

export interface TwoFAGenerateResponse {
    qrCodeUrl: string; // image en base64
    manualSecret: string; // code texte au cas ou la camera ne marche pas
}



async function generateTokens (
    userId: number,
    credentialId: number
): Promise<accAndRefTokens>
{
    const accessToken = generateAccessToken(userId, credentialId);
    const refreshToken = generateRefreshToken(userId);
    const expiresAt = getExpirationDate(30);

    return { accessToken, refreshToken, expiresAt}
}


export async function registerUser(
    db: Database,
    userId: number, 
    email: string, 
    password: string
): Promise<authResponse> 
{
    // 1. Vérification que l'email n'est pas déjà pris
    const existing = await credRepo.findByEmail(db, email);
    if (existing)
        throw new ConflictError('Email already in use');

    // 2. Hashage, génération 2fa
    const pwdHashed = await hashPassword(password);

    // 3. Insertion DB
    const credentialId = await credRepo.createCredentials(db, {
        userId,
        email,
        pwdHashed,
        twoFaSecret: null,
        twoFaMethod: 'NONE',
        emailOtp: null,
        emailOtpExpiresAt: null
    });

    // 4. Génération token
    const tokens = await generateTokens(userId, credentialId);

    // 5. Insertion dans la DB tokens
    await tokenRepo.createToken(db, {
        userId,
        credentialId, 
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
    });

    return { 
        accessToken: tokens.accessToken, 
        refreshToken: tokens.refreshToken, 
        userId 
    };
}

export async function registerGuest (
    db: Database,
    userId: number,
    email: string
): Promise<authResponse>
{
    // 1. Vérification que l'email n'est pas déjà pris
    const existing = await credRepo.findByEmail(db, email);
    if (existing)
        throw new ConflictError('Email already in use');

    // Faustine: on doit générer un mdp aléatoire pour le guest car il aime pas ne rien avoir 
    const uniqueGuestPwd = `guestPwd${userId}_${Date.now()}_${Math.random()}`;
    const uniqueGuestHash = await hashPassword(uniqueGuestPwd);

    // 2. Insertion DB
    const credentialId = await credRepo.createCredentials(db, {
        userId,
        email,
        pwdHashed: uniqueGuestHash,
        twoFaSecret: null,
        twoFaMethod: 'NONE',
        emailOtp: null,
        emailOtpExpiresAt: null
    });

    // 4. Génération token
    const tokens = await generateTokens(userId, credentialId);

    // 5. Insertion dans la DB tokens
    await tokenRepo.createToken(db, {
        userId,
        credentialId, 
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
    });

    return { 
        accessToken: tokens.accessToken, 
        refreshToken: tokens.refreshToken, 
        userId 
    };
}


export async function changeEmailInCredential (
    db: Database,
    userId: number,
    email: string
)
{
    const existing = await credRepo.findByEmail(db, email);
    if (existing)
        throw new ConflictError('Email already in use');

    await credRepo.changeEmail(db, userId, email);
}


export async function changePasswordInCredential (
    db: Database,
    credentialId: number,
    newPwd1: string,
): Promise<void> 
{

    const newHashedPwd = await crypt.hashPassword(newPwd1);

    await credRepo.changePwd(db, credentialId, newHashedPwd);
}


export async function loginUser(
    db: Database,
    email: string, 
    password: string
): Promise<LoginResponse> 
{
    
    const userId = await credRepo.findUserIdByEmail(db, email);
    if (!userId)
        throw new NotFoundError('No user matches the email');

    const credentialId = await credRepo.findByEmail(db, email);
    if (!credentialId)
        throw new NotFoundError('Unknown email');

    const isPasswordValid = await authenticatePassword(db, credentialId, password);
    if (!isPasswordValid)
        throw new UnauthorizedError ('Invalid password');

    // QUELLE EST LA METHODE 2FA ACTIVE

    // const is2FA = await credRepo.is2FAEnabled(db, userId);
    const method = await credRepo.get2FAMethod(db, userId);

    // CAS 1 : application (Google Authenticator)
    if (method === 'APP') {
        // 2FA active -> on ne donne pas les acces (refresk/access token) 
        // mais un tocken temporaire pour acceder a la page pour entrer le num
        const tempToken = generateTempToken(userId); // dans crypt, duree 5min
        return {
            require2fa: true, 
            tempToken: tempToken
        };
    }

    // CAS 2 : email
    if (method === 'EMAIL')
    {
        // generer le code
        const code = crypt.generateRandomCode(6);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Valide 10 min
        // sauvegarder en DB
        await credRepo.saveEmailCode(db, userId, code, expiresAt);
    
        try {
            await send2FAEmail(email, code);
        } catch (error) {
            console.error("Error during the sending of the code by email:", error);
            throw new Error("Not possible to send verification email");
        }

        console.log(`[ACTIVATION] Code envoyé à ${email}`)
        
        const tempToken = generateTempToken(userId);

        return {
            require2fa: true,
            tempToken: tempToken
        };

    }

    // CAS 3: pas de 2FA
    const tokens = await generateTokens(userId, credentialId);

    // on delete l'ancien token
    await tokenRepo.deleteTokenByCredentialId(db, credentialId);

    // on cree une nouvelle ligne en db
    await tokenRepo.createToken(db, {
        userId,
        credentialId,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
    })

    return { 
        accessToken: tokens.accessToken, 
        refreshToken: tokens.refreshToken, 
        userId: userId 
    };
}


export async function logoutUser(db: Database, refreshToken: string): Promise<void>{
    await tokenRepo.deleteRefreshToken(db, refreshToken);
}


export async function authenticatePassword(
    db: Database,
    credentialId: number,
    password: string
): Promise<boolean> 
{
    const credential =  await credRepo.getCredentialbyID(db, credentialId);
    if (!credential)
        throw new NotFoundError("Could not find any matching credential");
    
    return await crypt.verifyPassword(password, credential.pwdHashed);
}


// JWT pour refresh le refresh et l'access token

export async function refreshUser(
    db: Database,
    oldRefreshToken: string
): Promise<authResponse> {

    // chercher le token en DB
    const tokenRecord = await tokenRepo.findByRefreshToken(db, oldRefreshToken);
    if (!tokenRecord){
        throw new NotFoundError('Refresh token not found');
    }

    // verification expiration
    const now = new Date();
    const expiry = new Date(tokenRecord.expiresAt); // comparaison de string

    if (now > expiry){
        throw new UnauthorizedError('Refresh token expired');
    }

    // generation de nv secrets et des tokens
    const newAccessToken = generateAccessToken(tokenRecord.userId, tokenRecord.credentialId);
    const newRefreshToken = generateRefreshToken(tokenRecord.userId);
    const newExpiresAt = getExpirationDate(7);

    // mise a jour de la DB
    await tokenRepo.updateToken(db, tokenRecord.credentialId, newRefreshToken, newExpiresAt);

    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        userId:tokenRecord.userId
    };
}

// 2FA verification
// fonction qui genere le secret pour le QR code et le code pour le QRcode et l'email
// sauvegarde en DB les infos

export async function  generateTwoFA(
    db: Database,
    userId: number,
    type: 'APP' | 'EMAIL' = 'APP' // par defaut APP pour compatibilite
): Promise<TwoFAGenerateResponse | { message: string }> { //revoir le message

    if (type == 'APP')
    {
        // recuperer email (pour lafficher dans google authenticator)
        const email = await credRepo.getEmailbyID(db, userId);
        if (!email) 
            throw new NotFoundError("User not found");

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

        const otpauthUrl = totp.toString();

        // convertir l'url en image qr code (base64)
        const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

        return {
            qrCodeUrl: qrCodeDataUrl,
            manualSecret: secret.base32
        };
    }

    if (type === 'EMAIL')
    {
        const code = crypt.generateRandomCode(6);
        const expDate = new Date(Date.now() + 10 * 60 * 1000);

        await credRepo.saveEmailCode(db, userId, code, expDate);

        const email = await credRepo.getEmailbyID(db, userId);
        if (!email)
            throw new NotFoundError("User email not found");

        try {
            await send2FAEmail(email, code);
        } catch (error) {
            console.error("Erreur d'envoi de mail:", error);
            throw new Error("Not possible to send verification email");
        }

        console.log(`[ACTIVATION] Code envoyé à ${email}`)
        
        return { message : 'Code send by email' };
    }

    throw new Error("Invalid 2FA type");
}

// fonciton qui verifie le code envoye par lutilisateur et permet lactivation du 2FA
export async function verifyAndEnable2FA(
    db: Database,
    userId: number,
    code: string, // code envoye par lutilisateur
    type: 'APP' | 'EMAIL'
) : Promise<boolean> {

    let isValid = false;

    if (type === 'APP')
    {
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
            isValid = totp.validate({ token: code, window: 1}) !== null; // window = marge d'erreur -> serveur accepte le code actuel mais regarde aussi 1 periode avant et apres
    }
    else if (type === 'EMAIL')
    {
        const data = await credRepo.getEmailCodeData(db, userId);
        if (!data.code || !data.expiresAt)
            throw new Error("No code requested");
        
        const now = new Date();
        const expiredAt = new Date(data.expiresAt);

        if (code === data.code && now < expiredAt)
        {
            await credRepo.clearEmailCode(db, userId);
            isValid = true;
        }
    }

    if (isValid)
    {
        await credRepo.set2FAMethod(db, userId, type);
        return true;
    }
    
    return false;
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

    // 1. Recuperer la methode active
    const method = await credRepo.get2FAMethod(db, userId);
    let isValid = false;

    // ----VERIFICATION APP (TOTP)
    if (method === 'APP')
    {
        const secretStr = await credRepo.get2FASecret(db, userId);
        if (!secretStr)
            throw new Error("2FA not configured for this user");

        // verifier le code totp
        const totp = new TOTP({
            issuer: "Transcendence",
            label: "Transcendence",
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: Secret.fromBase32(secretStr)
        });

        const delta = totp.validate({ token: code, window: 1});
        if (delta !== null) {
            isValid = true;
        }
    }

    // ----VERIFICATION EMAIL (OTP)
    else if (method === 'EMAIL')
    {
        const data = await credRepo.getEmailCodeData(db, userId);
        if (!data.code || !data.expiresAt)
            return null;

        const now = new Date();
        const expiry = new Date(data.expiresAt);

        if (data.code === code && now < expiry)
        {
            isValid = true;
            await credRepo.clearEmailCode(db, userId);
        }
    }

    if (!isValid)
        return null;

    // ----LOGIN REUSSI

    // 2. recuperer le credential id necessaire pour la table TOKENS
    const credential = await credRepo.getCredentialbyUserID(db, userId);
    if (!credential)
        throw new NotFoundError("Credential not found");

    // 3. generer les vrais tokens (access + refresh)
    const tokens = await generateTokens(userId, credential.id);

    // 4. nettoyage : on supprime les vieux tokens de cet utilisateur
    await tokenRepo.deleteTokenByCredentialId(db, credential.id);

    // 5. sauvegarde: on enregistre le nouveau refresh token
    await tokenRepo.createToken(db, {
        userId: userId,
        credentialId: credential.id,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
    });

    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        userId: userId
    };
}

export async function deleteAuthData(
    db: Database, 
    userId: number, 
): Promise<void>
{
    try {
        await tokenRepo.deleteAllTokensForUser(db, userId);
        await credRepo.deleteCredentialsByUserId(db, userId);
    }
    catch (error) {
        console.error(`Error deleting auth data for user ${userId}`, error);
        throw error;
    }
}