const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: true, // true for 465, false for other ports
  auth: {
    user: config.SMTP_USER, // generated ethereal user
    pass: config.SMTP_PASS  // generated ethereal password
  }
});

// Send contact form email
const sendContactEmail = async (contactData) => {
  try {
    const { name, email, subject, message } = contactData;

    // Email to admin
    await transporter.sendMail({
      from: config.SMTP_FROM, // sender address
      to: config.SMTP_FROM,   // list of receivers (admin's email)
      subject: `New contact message: ${subject}`, // Subject line
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      ` // html body
    });

    // Confirmation email to user
    await transporter.sendMail({
      from: config.SMTP_FROM, // sender address
      to: email,              // list of receivers (user's email)
      subject: 'We received your message - AInovar', // Subject line
      html: `
        <h2>Hello ${name}!</h2>
        <p>Thank you for contacting us. We have received your message and will respond shortly.</p>
        <p>Sincerely,<br>The AInovar Team</p>
      ` // html body
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

module.exports = {
  sendContactEmail
};
