# Shift Four Properties API

Express API for lead intake and SMTP email delivery.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy env template and configure values:
   ```bash
   cp .env.example .env
   ```

3. Start API:
   ```bash
   npm start
   ```

API default: `http://localhost:3000`

## Endpoints

- `POST /api/leads`
- `GET /health`

## Environment Variables

- `PORT`
- `FRONTEND_ORIGIN`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `LEAD_FROM_EMAIL`
- `LEAD_TO_EMAIL`
- `LEAD_REPLY_TO`

## Email Test

```bash
npm run test:email
```
