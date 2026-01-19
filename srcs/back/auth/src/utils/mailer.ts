import nodemailer from 'nodemailer';

// SMTP -> Simple Mail Transfer Protocol

const transporter = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: parseInt(process.env.SMTP_PORT || "587"),
		secure: false,
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS
		}
});

export async function send2FAEmail(toEmail: string, code: string) : Promise<void> {

	const htmlContent = `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
			<h2 style="color: #4A90E2;">Transcendence 2FA</h2>
			<p>Here is your verification code :</p>
			<div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
				${code}
			</div>
			<p style="font-size: 12px; color: #888;">This code expires in 10 minutes.</p>
		</div>
	`;

	await transporter.sendMail({
		from: `Transcendance Security <${process.env.SMTP_USER}>`,
		to: toEmail,
		subject: `Your 2FA login code`,
		html: htmlContent,
	});

}

