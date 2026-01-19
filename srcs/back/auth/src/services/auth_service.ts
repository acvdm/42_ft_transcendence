import * as credRepo from "../repositories/credentials.js";
import * as tokenRepo from '../repositories/token.js';
import * as crypt from '../utils/crypto.js';
import { Secret, TOTP } from 'otpauth'; // Time-based One-Time Password
import * as QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import { send2FAEmail } from "../utils/mailer.js";
import { ConflictError, NotFoundError, ServiceUnavailableError, UnauthorizedError, ValidationError } from "../utils/error.js";

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
	expiresAt: string
}

export interface authResponse {
	accessToken: string,
	refreshToken: string,
	userId: number
}

export interface LoginResponse {
	// Classic case
	accessToken?: string;
	refreshToken?: string;
	userId?: number;

	// 2FA required
	require2fa?: boolean;
	tempToken?: string;
}

export interface TwoFAGenerateResponse {
	qrCodeUrl: string;
	manualSecret: string;
}


async function generateTokens (
	userId: number,
	credentialId: number
): Promise<accAndRefTokens>
{
	const accessToken = generateAccessToken(userId, credentialId);
	const refreshToken = generateRefreshToken(userId);
	const expiresAt = getExpirationDate(7);
	return { accessToken, refreshToken, expiresAt}
}


/*  
	1. Verify that the email address is not already taken
	2. Password hashing  
	3. DB insertion 
	4. Token generation
	5. Insertion into the DB tokens
*/

export async function registerUser(
	db: Database,
	userId: number,
	email: string,
	password: string
): Promise<authResponse>
{
	const existing = await credRepo.findByEmail(db, email);
	if (existing)
		throw new ConflictError('registerPage.error_email_already_taken');

	const pwdHashed = await hashPassword(password);

	const credentialId = await credRepo.createCredentials(db, {
		userId,
		email,
		pwdHashed,
		twoFaSecret: null,
		twoFaMethod: 'NONE',
		emailOtp: null,
		emailOtpExpiresAt: null
	});

	const tokens = await generateTokens(userId, credentialId);

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


/*  
    1.  Verify that the email address is not already taken
	2. Generating random password
	3. DB insertion 
	4. Token generation
	5. Insertion into the DB tokens
*/

export async function registerGuest (
	db: Database,
	userId: number,
	email: string
): Promise<authResponse>
{
	const existing = await credRepo.findByEmail(db, email);
	if (existing)
		throw new ConflictError('registerPage.error_email_already_taken');

	const uniqueGuestPwd = `guestPwd${userId}_${Date.now()}_${Math.random()}`;
	const uniqueGuestHash = await hashPassword(uniqueGuestPwd);

	const credentialId = await credRepo.createCredentials(db, {
		userId,
		email,
		pwdHashed: uniqueGuestHash,
		twoFaSecret: null,
		twoFaMethod: 'NONE',
		emailOtp: null,
		emailOtpExpiresAt: null
	});

	const tokens = await generateTokens(userId, credentialId);

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
		throw new ConflictError('registerPage.error_email_already_taken');

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
		throw new NotFoundError('loginPage.error_no_user');

	const credentialId = await credRepo.findByEmail(db, email);
	if (!credentialId)
		throw new NotFoundError('Unknown email');

	const isPasswordValid = await authenticatePassword(db, credentialId, password);
	if (!isPasswordValid)
		throw new UnauthorizedError ('loginPage.error_invalid_pwd');

	/* 2FA active */
	const method = await credRepo.get2FAMethod(db, userId);

	if (method === 'APP') {
		const tempToken = generateTempToken(userId);
		return {
			require2fa: true,
			tempToken: tempToken
		};
	}

	if (method === 'EMAIL')
	{
		const code = crypt.generateRandomCode(6);
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
		await credRepo.saveEmailCode(db, userId, code, expiresAt);

		try {
			await send2FAEmail(email, code);
		} catch (error) {
			console.error("Error during the sending of the code by email:", error);
			throw new ServiceUnavailableError("Not possible to send verification email");
		}

		console.log(`[ACTIVATION] Code sent to ${email}`)

		const tempToken = generateTempToken(userId);

		return {
			require2fa: true,
			tempToken: tempToken
		};

	}

	/* 2FA not active */
	const tokens = await generateTokens(userId, credentialId);

	await tokenRepo.deleteTokenByCredentialId(db, credentialId);

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


/* JWT : Refresh the access and refresh token when access token is up to 15min */

export async function refreshUser(
	db: Database,
	oldRefreshToken: string
): Promise<authResponse> {

	const tokenRecord = await tokenRepo.findByRefreshToken(db, oldRefreshToken);
	if (!tokenRecord)
		throw new NotFoundError('Refresh token not found');

	const now = new Date();
	const expiry = new Date(tokenRecord.expiresAt);

	if (isNaN(expiry.getTime()))
		throw new UnauthorizedError('Invalid refresh token expiration');

	if (now > expiry)
		throw new UnauthorizedError('Refresh token expired');

	const newAccessToken = generateAccessToken(tokenRecord.userId, tokenRecord.credentialId);
	const newRefreshToken = generateRefreshToken(tokenRecord.userId);
	const newExpiresAt = getExpirationDate(7);

	
	await tokenRepo.updateToken(db, tokenRecord.credentialId, newRefreshToken, newExpiresAt);
	console.log("✅ NEW Access Token generated:", newAccessToken);

	return {
		accessToken: newAccessToken,
		refreshToken: newRefreshToken,
		userId:tokenRecord.userId
	};
}

/* 2FA : generates the secret for the QR code and the code for the QR code and email */

export async function  generateTwoFA(
	db: Database,
	userId: number,
	type: 'APP' | 'EMAIL' = 'APP'
): Promise<TwoFAGenerateResponse | { message: string }> {

	if (type == 'APP')
	{
		const email = await credRepo.getEmailbyID(db, userId);
		if (!email)
			throw new NotFoundError("User not found");

		const secret = new Secret({ size: 20});

		await credRepo.update2FASecret(db, userId, secret.base32);

		const totp = new TOTP({
			issuer: "Transcendence",
			label: email,
			algorithm: "SHA1",
			digits: 6,
			period: 30,
			secret: secret
		});

		const otpauthUrl = totp.toString();

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
			throw new ServiceUnavailableError("Not possible to send verification email");
		}
		return { message : 'Code send by email' };
	}

	throw new ValidationError("Invalid 2FA type");
}

/* 
2FA : verifies the code sent by the user and enables 2FA activation
Convert the string back to a Secret object (it had been converted to a string to be put in the database).
window = margin of error -> server accepts the current code but also looks at 1 period before and after
*/

export async function verifyAndEnable2FA(
	db: Database,
	userId: number,
	code: string,
	type: 'APP' | 'EMAIL'
) : Promise<boolean> {

	let isValid = false;

	if (type === 'APP')
	{
		const secretStr = await credRepo.get2FASecret(db, userId);
		if (!secretStr)
			throw new ConflictError("2FA not initiated");

		const totp = new TOTP({
			issuer: "Transcendence",
			label: "Transcendence",
			algorithm: "SHA1",
			digits: 6,
			period: 30,
			secret: Secret.fromBase32(secretStr)
		});

		isValid = totp.validate({ token: code, window: 1}) !== null;
	}
	else if (type === 'EMAIL')
	{
		const data = await credRepo.getEmailCodeData(db, userId);
		if (!data.code || !data.expiresAt)
			throw new ConflictError("No code requested");

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

/* 
2FA : 
verify the code entered at login
if ok -> generate the real tokens
save the refresh token in the database 
*/

export async function finalizeLogin2FA(
	db: Database,
	userId: number,
	code: string
): Promise<authResponse | null>
{

	const method = await credRepo.get2FAMethod(db, userId);
	let isValid = false;

	if (method === 'APP')
	{
		const secretStr = await credRepo.get2FASecret(db, userId);
		if (!secretStr)
			throw new ConflictError("2FA not configured for this user");

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

	const credential = await credRepo.getCredentialbyUserID(db, userId);
	if (!credential)
		throw new NotFoundError("Credential not found");

	const tokens = await generateTokens(userId, credential.id);

	await tokenRepo.deleteTokenByCredentialId(db, credential.id);

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
