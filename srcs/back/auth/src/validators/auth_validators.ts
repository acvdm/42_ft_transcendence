import validator from 'validator';

function isValidPassword(pwd: string): boolean {
    const hasMinLength = pwd.length >= 8;
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>']/.test(pwd);

    return hasMinLength && hasLowerCase && hasUpperCase && hasDigit && hasSpecialChar;
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