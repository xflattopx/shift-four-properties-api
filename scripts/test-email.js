const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');

async function run() {
    const smtpHost = process.env.SMTP_HOST || process.env.HOST || process.env.MAIL_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
    const smtpUser = process.env.SMTP_USER || process.env.USER || process.env.MAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.PASS || process.env.MAIL_PASS;

    const secureSource = process.env.SMTP_SECURE || process.env.SECURE;
    const smtpSecure = typeof secureSource === 'string'
        ? secureSource.toLowerCase() === 'true'
        : smtpPort === 465;

    const fromEmail = process.env.LEAD_FROM_EMAIL || process.env.FROM_EMAIL || process.env.EMAIL_FROM || smtpUser;
    const toEmail = process.env.LEAD_TO_EMAIL || process.env.TO_EMAIL || process.env.EMAIL_TO || smtpUser;

    const required = [
        { key: 'host', value: smtpHost },
        { key: 'user', value: smtpUser },
        { key: 'pass', value: smtpPass }
    ];

    const missing = required.filter(function(item) {
        return !item.value;
    }).map(function(item) {
        return item.key;
    });

    if (missing.length > 0) {
        console.error('Missing required .env values:', missing.join(', '));
        process.exit(1);
    }

    if (!fromEmail || !toEmail) {
        console.error('Missing sender/recipient values. Set LEAD_FROM_EMAIL or FROM_EMAIL, and LEAD_TO_EMAIL or TO_EMAIL.');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
            user: smtpUser,
            pass: smtpPass
        }
    });

    await transporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: 'Shift Four Properties Local Test Email',
        text: [
            'This is a local SMTP test from your landing page project.',
            '',
            'If you received this, email delivery is configured correctly.'
        ].join('\n')
    });

    console.log('Test email sent successfully to', toEmail);
}

run().catch(function(error) {
    console.error('Test email failed:', error.message);
    process.exit(1);
});
