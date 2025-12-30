import validator from 'validator';
import { ValidationError} from '../utils/error.js';

export function isValidPassword(pwd: string): boolean 
{
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

export function validateRegisterInput(body: any) 
{
    // Vérifier que email est valide, password assez fort, etc
    if (!body)
        throw new ValidationError('Invalid request body');

    if (!body.email || !body.password)
        throw new ValidationError('Missing required fields');

    if (!validator.isEmail(body.email))
        throw new ValidationError('Email address not supported');

    if (!isValidPassword(body.password))
        throw new ValidationError('Password must contain at least 8 characters, one lowercase, one uppercase, one digit and one special character');
}

export function validateNewEmail(body: any) 
{
    if (!body)
    {
        console.log("body n'existe pas");
        throw new ValidationError('Invalid request body');
    }
    if (!body.email)
    {
        console.log("body email n'existe pas");
        throw new ValidationError('Missing required field');
    }    
    if (!validator.isEmail(body.email))
    {
        console.log("email ne ressemble pas à un email");
        throw new ValidationError('Email address not supported');
    }
}
