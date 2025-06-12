require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3001,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ainovar',
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || 'luizvalois@ainovar.tech',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
}; 