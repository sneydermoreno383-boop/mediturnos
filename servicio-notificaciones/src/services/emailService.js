require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const enviarEmail = async ({ destinatario, asunto, contenido }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: destinatario,
      subject: asunto,
      html: contenido
    });
    console.log(`Email enviado a ${destinatario}`);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error.message);
    return false;
  }
};

module.exports = { enviarEmail };