# PromptToPlay

AI-powered HTML5 game generator using DeepSeek V4 Pro.

## Setup

1. Copy `.env.example` to `.env` and fill in your API keys:
   ```bash
   cp .env.example .env
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create data directory:
   ```bash
   mkdir -p data
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| DEEPSEEK_API_KEY | Yes | DeepSeek API key |
| JWT_SECRET | Yes | Secret for JWT signing |
| STRIPE_SECRET_KEY | No | Stripe secret key (for payments) |
| STRIPE_WEBHOOK_SECRET | No | Stripe webhook signing secret |
| PORT | No | Server port (default: 3000) |
| DOMAIN | No | Public domain for Stripe redirects |

## Quota System

- **Free**: 3 generations per day
- **Pro**: 400 generations per month ($9.90/month)
- **Enterprise**: 3000 generations per month

Extra generations can be earned through:
- **Sharing**: +1 per day via the share button
- **Invites**: +1 when an invited user creates their first game

## Tech Stack

- Node.js + Express
- SQLite (auto-created on startup)
- Vanilla HTML/CSS/JS frontend
- DeepSeek V4 Pro for game generation
- Stripe for payments
