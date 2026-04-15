const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';

function getMailConfig() {
    const smtpHost = process.env.SMTP_HOST || process.env.HOST || process.env.MAIL_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 587);
    const smtpUser = process.env.SMTP_USER || process.env.USER || process.env.MAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.PASS || process.env.MAIL_PASS;

    const secureSource = process.env.SMTP_SECURE || process.env.SECURE;
    const smtpSecure = typeof secureSource === 'string'
        ? secureSource.toLowerCase() === 'true'
        : smtpPort === 465;

    const fromEmail =
        process.env.LEAD_FROM_EMAIL ||
        process.env.FROM_EMAIL ||
        process.env.EMAIL_FROM ||
        smtpUser;

    const toEmail =
        process.env.LEAD_TO_EMAIL ||
        process.env.TO_EMAIL ||
        process.env.EMAIL_TO ||
        smtpUser;

    const replyToEmail =
        process.env.LEAD_REPLY_TO ||
        process.env.REPLY_TO_EMAIL ||
        toEmail;

    return {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        smtpSecure,
        fromEmail,
        toEmail,
        replyToEmail
    };
}

app.use(express.json());

// Allow browser requests from the deployed frontend origin.
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', frontendOrigin);
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    return next();
});

function createTransporter(mailConfig) {
    return nodemailer.createTransport({
        host: mailConfig.smtpHost,
        port: mailConfig.smtpPort,
        secure: mailConfig.smtpSecure,
        auth: {
            user: mailConfig.smtpUser,
            pass: mailConfig.smtpPass
        }
    });
}

function validateLead(payload) {
    const { name, phone, address, condition, timeline } = payload;

    if (!name || !phone || !address || !condition || !timeline) {
        return 'Missing required fields.';
    }

    const phonePattern = /^\+?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
    if (!phonePattern.test(phone)) {
        return 'Invalid phone number format.';
    }

    return null;
}

app.post('/api/leads', async (req, res) => {
    const mailConfig = getMailConfig();
    const error = validateLead(req.body || {});
    if (error) {
        return res.status(400).json({ ok: false, message: error });
    }

    if (!mailConfig.smtpHost || !mailConfig.smtpUser || !mailConfig.smtpPass || !mailConfig.toEmail || !mailConfig.fromEmail) {
        return res.status(500).json({ ok: false, message: 'Email settings are incomplete on the server.' });
    }

    const { name, phone, address, condition, timeline } = req.body;
    const transporter = createTransporter(mailConfig);

    const submittedAt = new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
    });

    // Flag urgent leads in subject line
    const isUrgent = timeline && timeline.toLowerCase().includes('asap');
    const subject = isUrgent
        ? `🔥 URGENT Seller Lead: ${name} — Needs to sell NOW`
        : `New Seller Lead: ${name}`;

    const text = [
        isUrgent ? '⚠️  URGENT — Seller indicated they need to sell ASAP.' : 'New motivated seller lead received.',
        '',
        `Name:               ${name}`,
        `Phone:              ${phone}`,
        `Property Address:   ${address}`,
        `Property Condition: ${condition}`,
        `Timeline:           ${timeline}`,
        `Submitted:          ${submittedAt}`,
        '',
        '--- Reply to this email to reach the seller directly ---'
    ].join('\n');

    try {
        await transporter.sendMail({
            from: mailConfig.fromEmail,
            to: mailConfig.toEmail,
            subject,
            text,
            replyTo: mailConfig.replyToEmail
        });

        return res.status(200).json({ ok: true });
    } catch (mailError) {
        console.error('Lead email failed:', mailError);
        return res.status(500).json({ ok: false, message: 'Unable to send email right now.' });
    }
});

app.get('/health', (req, res) => {
    res.status(200).json({ ok: true });
});

app.listen(port, () => {
    console.log(`Shift Four Properties app listening on port ${port}`);
});
