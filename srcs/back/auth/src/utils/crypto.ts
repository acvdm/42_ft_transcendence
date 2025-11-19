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

export function generate2FASecret(): string {
    const secret = new Secret({ size: 20 }); // 20 bytes = 32 char en base32
    return secret.base32;
 }


// Module JWT
export function generateRefreshToken(): string {
    return ('refreshToken');
 }