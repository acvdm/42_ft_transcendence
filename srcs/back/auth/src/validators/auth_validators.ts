import validator from 'validator';
import { ValidationError} from '../utils/error.js';

export function isValidPassword(pwd: string): boolean
{
	const hasMinLength: boolean = pwd.length >= 8;
	const isNotTooLong: boolean = pwd.length <= 128;
	const hasLowerCase: boolean = /[a-z]/.test(pwd);
	const hasUpperCase: boolean = /[A-Z]/.test(pwd);
	const hasDigit: boolean = /[0-9]/.test(pwd);
	const hasSpecialChar: boolean = /[!@#$%^&*(),.?":{}|<>']/.test(pwd);

	let maxLengthOK: boolean = false;
	if (pwd.length <= 72)
		maxLengthOK = true;

	return hasMinLength && isNotTooLong && hasLowerCase && hasUpperCase && hasDigit && hasSpecialChar && maxLengthOK;
}

export function validateRegisterInput(body: any)
{
	if (!body)
		throw new ValidationError('Invalid request body');

	if (!body.email || !body.password)
		throw new ValidationError('Missing required fields');

	if (!validator.isEmail(body.email))
		throw new ValidationError('registerPage.error_email');

	if (!isValidPassword(body.password))
		throw new ValidationError('registerPage.error_password');
}

export function validateNewEmail(body: any)
{
	if (!body)
	{
		throw new ValidationError('registerPage.error_inputs');
	}
	if (!body.email)
	{
		throw new ValidationError('registerPage.error_inputs');
	}
	if (body.email.length > 254)
	{
		throw new ValidationError('registerPage.error_email_too_long');
	}
	if (!validator.isEmail(body.email))
	{
		throw new ValidationError('Email address not supported');
	}
}
