import nodemailer from 'nodemailer';

// SMTP -> transporteur


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
    console.log(`Tentative d'envoi de mail a ${toEmail}...`);

    const htmlContent = `<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
            <h2 style="color: #4A90E2;">Transcendance 2FA</h2>
            <p>Voici votre code de vérification :</p>
            <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                ${code}
            </div>
            <p style="font-size: 12px; color: #888;">Ce code expire dans 10 minutes.</p>
        </div>
    `;

    await transporter.sendMail({
        from: `Transcendance Security <${process.env.SMTP_USER}>`,
        to: toEmail,
        subject: `Votre code de connexion 2FA`,
        html: htmlContent,
    });

    console.log(`Mail envoye avec succes !`);
}

// false -> ne pas commencer la connexion en SSL direct, 
// le serveur (serveur mail de google) qui supporte le cryptage 
// l'active au moment de l'envoi du mot de passe
// 587 : standard moderne recommande pour l'envoi de mails par de appli ("Soumission de message")

