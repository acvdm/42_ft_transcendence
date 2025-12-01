import validator from 'validator';
import { createToken, CreateTokenData } from '../repositories/token.js';
import { hashPassword } from '../utils/crypto.js';
import { Database } from 'sqlite';

function isValidPassword(pwd: string): boolean {
    const hasMinLength: boolean = pwd.length >= 8;
    const hasLowerCase: boolean = /[a-z]/.test(pwd);
    const hasUpperCase: boolean = /[A-Z]/.test(pwd);
    const hasDigit: boolean = /[0-9]/.test(pwd);
    const hasSpecialChar: boolean = /[!@#$%^&*(),.?":{}|<>']/.test(pwd);
    
    let maxLengthOK: boolean = false;
    if (pwd.length <= 72)
        maxLengthOK = true;

    return hasMinLength && hasLowerCase && hasUpperCase && hasDigit && hasSpecialChar && maxLengthOK;
}

export function validateRegisterInput(body: any) {
    // Vérifier que email est valide, password assez fort, etc
    if (!body)
        throw new Error('Invalid request body');

    if (!body.email || !body.password)
        throw new Error('Missing required fields');

    if (!validator.isEmail(body.email))
        throw new Error('Email address not supported');

    if (!isValidPassword(body.password))
        throw new Error('Password must contain at least 8 characters, one lowercase, one uppercase, one digit and one special character');
}
