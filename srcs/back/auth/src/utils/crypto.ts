import jwt from 'jsonwebtoken'; // pour .sign() et .verify()
import argon2 from 'argon2'; // algo hachage de mdp
import { randomBytes } from 'crypto'; // generateur de hasard .hash() .verify() comparaison mdp et hash
import { Secret } from 'otpauth'; // 2FA

// usine de fabrication --> ne touche pas a la bdd mais genere des chaines de caracteres, etc

// recuperation de la var d'env 
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
): Promise <boolean> {
    return await argon2.verify(pwd_hashed, password);
}

export function generate2FASecret(): string {
    const secret = new Secret({ size: 20 }); // 20 bytes = 32 char en base32
    return secret.base32;
 }

// Module JWT
// Access Token : Signe avec le secret du .env
export function generateAccessToken(user_id: number, credential_id: number): string {
    const payload = {
        sub: user_id,
        cred_id: credential_id
    };
    return jwt.sign(payload, JWT_SECRET!, { expiresIn: '7m'}); // MODIF DE TEST 10s
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