import "dotenv/config";
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.GMAIL_HOST,
    port: process.env.GMAIL_PORT,
    secure: false, // use STARTTLS (upgrade connection to TLS after connecting)
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.GMAIL_PASSWORD
    }

})

export default transporter;
