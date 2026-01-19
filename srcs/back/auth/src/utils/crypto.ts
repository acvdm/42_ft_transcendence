import jwt from 'jsonwebtoken'; // .sign() .verify()
import argon2 from 'argon2'; // hashing pwd
import { randomBytes, randomInt } from 'crypto';
import { Secret, TOTP } from 'otpauth';
import * as QRCode from 'qrcode';
import * as tokenRepo from '../repositories/token.js';
import * as credRepo from '../repositories/credentials.js';
import { ServiceUnavailableError } from './error.js';


export interface TwoFAGenerateResponse {
	qrCodeUrl: string;
	manualSecret: string;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET){
	console.error("FATAL ERROR: JWT_SECRET is not defined in .env");
	process.exit(1);
}

export async function hashPassword(password: string): Promise<string> {
	try {
		const hash = await argon2.hash(password);
		return (hash);
	} catch (err) {
		throw new ServiceUnavailableError('Password hashing failed');
	}	
}

export async function verifyPassword(
	password: string, 
	pwd_hashed: string
): Promise <boolean> 
{
	return await argon2.verify(pwd_hashed, password);
}

export function generateAccessToken(userId: number, credential_id: number): string {
	const payload = {
		sub: userId,
		cred_id: credential_id
	};
	return jwt.sign(payload, JWT_SECRET!, { expiresIn: '15m'});
}

export function generateRefreshToken(user_id: number): string {
	return (randomBytes(32).toString('hex'));
 }

export function verifyAccessToken(token: string): any {
	try {
		return jwt.verify(token, JWT_SECRET!);
	} catch (e) {
		return null;
	}
}

/* 2FA - temp token before the send of access and refresh token */

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
