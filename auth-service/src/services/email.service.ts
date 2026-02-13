import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@profroid.com";
const FRONTEND_URL =
  process.env.FRONTEND_URLS?.split(",")[0] || "http://localhost:5173";

/**
 * Helper function to get language (default to 'en')
 */
function getLanguage(lang?: string): 'en' | 'fr' {
  return (lang === 'fr' || lang === 'FR') ? 'fr' : 'en';
}

/**
 * Helper function to get email strings based on language
 */
function getEmailStrings(language: 'en' | 'fr') {
  const strings = {
    en: {
      resetSubject: "Password Reset Request - Profroid",
      resetGreeting: "Hello",
      resetMessage1: "We received a request to reset the password for your Profroid account. If you didn't make this request, you can safely ignore this email and your password will remain unchanged.",
      resetMessage2: "To reset your password, click the button below:",
      resetButton: "Reset Your Password",
      resetLinkText: "Or use this link",
      securityTitle: "Security Information",
      securityPoint1: "This password reset link will expire in 1 hour",
      securityPoint2: "Never share this link with anyone, including Profroid support staff",
      securityPoint3: "If you didn't request this reset, please ignore this email",
      securityPoint4: "Consider enabling two-factor authentication for added security",
      changedSubject: "Password Changed Successfully - Profroid",
      changedMessage: "Your Profroid account password was recently changed. If you made this change, no further action is required. Your account remains secure and protected.",
      changedTitle: "Password Changed Successfully",
      changedSubtitle: "Your account is secure",
      warningTitle: "Didn't Make This Change?",
      warningMessage: "If you did NOT authorize this password change, take immediate action:",
      warningPoint1: "Your account may have been compromised",
      warningPoint2: "Contact our support team immediately",
      warningPoint3: "Review your recent account activity",
      warningPoint4: "Change passwords on other services where you use the same credentials",
      securityTip: "Security Best Practices",
      securityTipText: "To keep your account secure, we recommend using a unique, strong password and enabling two-factor authentication if available.",
      changeOccurred: "Change occurred on:",
      footer: "This is an automated message from Profroid.",
      copyright: "All rights reserved.",
    },
    fr: {
      resetSubject: "Demande de réinitialisation du mot de passe - Profroid",
      resetGreeting: "Bonjour",
      resetMessage1: "Nous avons reçu une demande de réinitialisation du mot de passe pour votre compte Profroid. Si vous n'avez pas effectué cette demande, vous pouvez ignorer cet e-mail en toute sécurité et votre mot de passe restera inchangé.",
      resetMessage2: "Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :",
      resetButton: "Réinitialiser votre mot de passe",
      resetLinkText: "Ou utilisez ce lien",
      securityTitle: "Informations de sécurité",
      securityPoint1: "Ce lien de réinitialisation du mot de passe expirera dans 1 heure",
      securityPoint2: "Ne partagez jamais ce lien avec quiconque, y compris avec le personnel de support Profroid",
      securityPoint3: "Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail",
      securityPoint4: "Envisagez d'activer l'authentification à deux facteurs pour une sécurité accrue",
      changedSubject: "Mot de passe modifié avec succès - Profroid",
      changedMessage: "Le mot de passe de votre compte Profroid a été récemment modifié. Si vous avez effectué cette modification, aucune action supplémentaire n'est requise. Votre compte reste sécurisé et protégé.",
      changedTitle: "Mot de passe modifié avec succès",
      changedSubtitle: "Votre compte est sécurisé",
      warningTitle: "Vous n'avez pas effectué cette modification ?",
      warningMessage: "Si vous N'AVEZ PAS autorisé cette modification du mot de passe, agissez immédiatement :",
      warningPoint1: "Votre compte a peut-être été compromis",
      warningPoint2: "Contactez immédiatement notre équipe d'assistance",
      warningPoint3: "Examinez votre activité de compte récente",
      warningPoint4: "Modifiez les mots de passe sur les autres services où vous utilisez les mêmes identifiants",
      securityTip: "Bonnes pratiques de sécurité",
      securityTipText: "Pour garder votre compte sécurisé, nous vous recommandons d'utiliser un mot de passe unique et fort, et d'activer l'authentification à deux facteurs si disponible.",
      changeOccurred: "Modification effectuée le :",
      footer: "Ceci est un message automatisé de Profroid.",
      copyright: "Tous les droits sont réservés.",
    },
  };
  return strings[language];
}

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });
};

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  name?: string,
  language?: string,
): Promise<void> {
  const transporter = createTransporter();
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;
  const lang = getLanguage(language);
  const strings = getEmailStrings(lang);

  const mailOptions = {
    from: SMTP_FROM,
    to: email,
    subject: strings.resetSubject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #3a2e2a;
              background-color: #f4f1ec;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(122, 9, 1, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #7a0901 0%, #a32c1a 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              color: #ffffff;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: 1px;
              margin-bottom: 10px;
            }
            .header-subtitle {
              color: #f4f1ec;
              font-size: 14px;
              font-weight: 400;
            }
            .content {
              padding: 40px 30px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #3a2e2a;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .message {
              color: #5c504b;
              margin-bottom: 15px;
              font-size: 15px;
            }
            .button-container {
              text-align: center;
              margin: 35px 0;
            }
            .button {
              display: inline-block;
              padding: 16px 40px;
              background: linear-gradient(90deg, #7a0901 0%, #a32c1a 100%);
              color: #ffffff !important;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              font-size: 16px;
              transition: transform 0.2s ease;
              box-shadow: 0 4px 12px rgba(122, 9, 1, 0.25);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(122, 9, 1, 0.35);
            }
            .divider {
              margin: 30px 0;
              text-align: center;
              position: relative;
            }
            .divider::before {
              content: '';
              position: absolute;
              left: 0;
              top: 50%;
              width: 100%;
              height: 1px;
              background-color: #e4e2df;
            }
            .divider-text {
              display: inline-block;
              background-color: #ffffff;
              padding: 0 15px;
              color: #6b615c;
              font-size: 13px;
              position: relative;
            }
            .link-fallback {
              background-color: #f4f1ec;
              padding: 15px;
              border-radius: 6px;
              word-break: break-all;
              font-size: 13px;
              color: #5c504b;
              margin: 20px 0;
            }
            .security-notice {
              background-color: #fff8f0;
              border-left: 4px solid #a32c1a;
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .security-notice-title {
              color: #7a0901;
              font-weight: 600;
              margin-bottom: 12px;
              font-size: 15px;
            }
            .security-notice ul {
              margin-left: 20px;
              color: #5c504b;
            }
            .security-notice li {
              margin: 8px 0;
              font-size: 14px;
            }
            .footer {
              background-color: #f4f1ec;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e4e2df;
            }
            .footer-text {
              color: #6b615c;
              font-size: 13px;
              line-height: 1.8;
            }
            .footer-brand {
              color: #7a0901;
              font-weight: 600;
              font-size: 14px;
              margin-top: 15px;
            }
            .footer-copyright {
              color: #8b817c;
              font-size: 12px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo">PROFROID</div>
              <div class="header-subtitle">${lang === 'fr' ? 'Gestion professionnelle des services' : 'Professional Service Management'}</div>
            </div>
            <div class="content">
              <p class="greeting">${strings.resetGreeting} ${name || (lang === 'fr' ? 'Utilisateur' : 'User')},</p>
              
              <p class="message">${strings.resetMessage1}</p>
              
              <p class="message">${strings.resetMessage2}</p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">${strings.resetButton}</a>
              </div>
              
              <div class="security-notice">
                <div class="security-notice-title">${strings.securityTitle}</div>
                <ul>
                  <li>${strings.securityPoint1}</li>
                  <li>${strings.securityPoint2}</li>
                  <li>${strings.securityPoint3}</li>
                  <li>${strings.securityPoint4}</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">${strings.footer}<br>Please do not reply to this email.</p>
              <div class="footer-brand">PROFROID</div>
              <p class="footer-copyright">&copy; ${new Date().getFullYear()} Profroid. ${strings.copyright}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
${strings.resetGreeting} ${name || (lang === 'fr' ? 'Utilisateur' : 'User')},

${strings.resetMessage1}

${strings.resetMessage2}

${resetUrl}

${lang === 'fr' ? 'Ce lien expirera dans 1 heure.' : 'This link will expire in 1 hour.'}

${lang === 'fr' ? 'Si vous n\'avez pas demandé cette réinitialisation du mot de passe, vous pouvez ignorer cet e-mail en toute sécurité.' : 'If you didn\'t request this password reset, you can safely ignore this email.'}

${lang === 'fr' ? 'Cordialement, L\'équipe Profroid' : 'Best regards, The Profroid Team'}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email} (${lang})`);
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
}

/**
 * Send password change confirmation email
 */
export async function sendPasswordChangedEmail(
  email: string,
  name?: string,
  language?: string,
): Promise<void> {
  const transporter = createTransporter();
  const lang = getLanguage(language);
  const strings = getEmailStrings(lang);

  const mailOptions = {
    from: SMTP_FROM,
    to: email,
    subject: strings.changedSubject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #3a2e2a;
              background-color: #f4f1ec;
              padding: 20px;
            }
            .email-wrapper {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(122, 9, 1, 0.1);
            }
            .header {
              background: linear-gradient(135deg, #7a0901 0%, #a32c1a 100%);
              padding: 40px 30px;
              text-align: center;
            }
            .logo {
              color: #ffffff;
              font-size: 32px;
              font-weight: 700;
              letter-spacing: 1px;
              margin-bottom: 10px;
            }
            .header-subtitle {
              color: #f4f1ec;
              font-size: 14px;
              font-weight: 400;
            }
            .content {
              padding: 40px 30px;
              background-color: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #3a2e2a;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .message {
              color: #5c504b;
              margin-bottom: 15px;
              font-size: 15px;
            }
            .success-banner {
              background: linear-gradient(135deg, #d4f1d9 0%, #e8f5e9 100%);
              border-left: 4px solid #4caf50;
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
              text-align: center;
            }
            .success-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            .success-title {
              color: #2e7d32;
              font-weight: 600;
              font-size: 18px;
              margin-bottom: 5px;
            }
            .success-subtitle {
              color: #558b5a;
              font-size: 14px;
            }
            .warning-notice {
              background-color: #fff4e6;
              border-left: 4px solid #ff9800;
              padding: 20px;
              margin: 25px 0;
              border-radius: 4px;
            }
            .warning-notice-title {
              color: #e65100;
              font-weight: 600;
              margin-bottom: 12px;
              font-size: 15px;
            }
            .warning-notice ul {
              margin-left: 20px;
              color: #5c504b;
            }
            .warning-notice li {
              margin: 8px 0;
              font-size: 14px;
            }
            .security-tip {
              background-color: #f4f1ec;
              padding: 20px;
              border-radius: 6px;
              margin: 25px 0;
            }
            .security-tip-title {
              color: #7a0901;
              font-weight: 600;
              margin-bottom: 10px;
              font-size: 15px;
            }
            .security-tip-text {
              color: #5c504b;
              font-size: 14px;
            }
            .footer {
              background-color: #f4f1ec;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e4e2df;
            }
            .footer-text {
              color: #6b615c;
              font-size: 13px;
              line-height: 1.8;
            }
            .footer-brand {
              color: #7a0901;
              font-weight: 600;
              font-size: 14px;
              margin-top: 15px;
            }
            .footer-copyright {
              color: #8b817c;
              font-size: 12px;
              margin-top: 10px;
            }
            .timestamp {
              color: #8b817c;
              font-size: 13px;
              margin-top: 15px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="header">
              <div class="logo">PROFROID</div>
              <div class="header-subtitle">${lang === 'fr' ? 'Gestion professionnelle des services' : 'Professional Service Management'}</div>
            </div>
            <div class="content">
              <p class="greeting">${strings.resetGreeting} ${name || (lang === 'fr' ? 'Utilisateur' : 'User')},</p>
              
              <div class="success-banner">
                <div class="success-icon">✓</div>
                <div class="success-title">${strings.changedTitle}</div>
                <div class="success-subtitle">${strings.changedSubtitle}</div>
              </div>
              
              <p class="message">${strings.changedMessage}</p>
              
              <p class="timestamp">${strings.changeOccurred} ${new Date().toLocaleString(
                lang === 'fr' ? "fr-FR" : "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZoneName: "short",
                },
              )}</p>
              
              <div class="warning-notice">
                <div class="warning-notice-title">${strings.warningTitle}</div>
                <p class="message" style="margin-bottom: 10px;">${strings.warningMessage}</p>
                <ul>
                  <li>${strings.warningPoint1}</li>
                  <li>${strings.warningPoint2}</li>
                  <li>${strings.warningPoint3}</li>
                  <li>${strings.warningPoint4}</li>
                </ul>
              </div>
              
              <div class="security-tip">
                <div class="security-tip-title">${strings.securityTip}</div>
                <p class="security-tip-text">${strings.securityTipText}</p>
              </div>
            </div>
            <div class="footer">
              <p class="footer-text">${lang === 'fr' ? 'Ceci est une notification de sécurité automatisée de Profroid.' : 'This is an automated security notification from Profroid.'}<br>Please do not reply to this email.</p>
              <div class="footer-brand">PROFROID</div>
              <p class="footer-copyright">&copy; ${new Date().getFullYear()} Profroid. ${strings.copyright}</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
${strings.resetGreeting} ${name || (lang === 'fr' ? 'Utilisateur' : 'User')},

${strings.changedMessage}

${lang === 'fr' ? 'Si vous avez effectué cette modification, aucune action supplémentaire n\'est requise.' : 'If you made this change, no further action is needed.'}

${lang === 'fr' ? 'Si vous n\'avez pas effectué cette modification, veuillez contacter notre équipe d\'assistance immédiatement.' : 'If you did not make this change, please contact our support team immediately.'}

${lang === 'fr' ? 'Cordialement, L\'équipe Profroid' : 'Best regards, The Profroid Team'}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password changed confirmation email sent to ${email} (${lang})`);
  } catch (error) {
    console.error("Error sending password changed email:", error);
    // Don't throw error for confirmation emails - it's not critical
  }
}
