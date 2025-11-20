import argon2 from 'argon2';
import { Secret } from 'otpauth';

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
export function generateAccessToken(user_id: number, credential_id: number): string {
    return ('accessToken');
}

// Module JWT
export function generateRefreshToken(): string {
    return ('refreshToken');
 }