import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
});

export async function send2FAEmail() {
    
}

// false -> ne pas commencer la connexion en SSL direct, 
// le serveur (serveur mail de google) qui supporte le cryptage 
// l'active au moment de l'envoi du mot de passe
// 587 : standard moderne recommande pour l'envoi de mails par de appli ("Soumission de message")

