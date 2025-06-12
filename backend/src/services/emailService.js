const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: true,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS
  }
});

// Send contact form email
const sendContactEmail = async (contactData) => {
  try {
    const { name, email, subject, message } = contactData;

    // Email to admin
    await transporter.sendMail({
      from: config.SMTP_FROM,
      to: config.SMTP_FROM,
      subject: `Nova mensagem de contato: ${subject}`,
      html: `
        <h2>Nova mensagem de contato</h2>
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Assunto:</strong> ${subject}</p>
        <p><strong>Mensagem:</strong></p>
        <p>${message}</p>
      `
    });

    // Confirmation email to user
    await transporter.sendMail({
      from: config.SMTP_FROM,
      to: email,
      subject: 'Recebemos sua mensagem - Ainovar',
      html: `
        <h2>Olá ${name}!</h2>
        <p>Obrigado por entrar em contato conosco. Recebemos sua mensagem e responderemos em breve.</p>
        <p>Atenciosamente,<br>Equipe Ainovar</p>
      `
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = {
  sendContactEmail
}; 