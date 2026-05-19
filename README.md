# Akrasia — Full-Stack Website

> Custom web development agency website with a production-ready backend, PostgreSQL database, and automated email system.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | Vanilla HTML / CSS / JavaScript   |
| Backend   | Node.js · Express.js              |
| Database  | PostgreSQL (via Prisma ORM)       |
| Email     | Nodemailer (SMTP / Gmail)         |
| Security  | Helmet · CORS · express-rate-limit · Zod |
| Deploy    | Vercel (frontend) · Railway/Render/Docker (backend) |

---

## Project Structure

```
akrasia/
├── frontend/               Static HTML pages + CSS + JS
│   ├── index.html
│   ├── contact.html
│   ├── pricing.html
│   ├── services.html
│   ├── start.html          ← project quote form
│   └── src/js/main.js      ← form → API integration
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma   ← DB schema (contacts, orders, logs)
│   └── src/
│       ├── app.js          ← Express bootstrap
│       ├── config/         ← env var loader
│       ├── controllers/    ← contactController, orderController, healthController
│       ├── routes/         ← /api/contact  /api/orders  /api/health
│       ├── services/       ← emailService (Nodemailer + HTML templates)
│       ├── validators/     ← Zod schemas for all form payloads
│       ├── middlewares/    ← security, errorHandler, requestLogger
│       ├── utils/          ← helpers (hashIp, asyncHandler), logger
│       └── database/       ← Prisma singleton
│
├── infra/
│   ├── docker/             ← Dockerfiles
│   └── nginx/              ← Nginx config
├── docker-compose.yml      ← Production compose
└── docker-compose.dev.yml  ← Local dev (DB only)
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ **OR** Docker

### 1 — Start the database

**Option A — Docker (recommended):**
```bash
docker-compose -f docker-compose.dev.yml up -d
# PostgreSQL is now running on localhost:5432
```

**Option B — Local PostgreSQL:**
```bash
createdb akrasia_db
```

### 2 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://akrasia_user:devpassword@localhost:5432/akrasia_db

SMTP_USER=teamtheakrasia@gmail.com
SMTP_PASS=your_gmail_app_password      # see Gmail App Passwords below
```

### 3 — Install dependencies & run migrations

```bash
cd backend
npm install
npm run db:generate    # generate Prisma client
npm run db:migrate:dev # create tables in the database
```

### 4 — Start the backend

```bash
npm run dev            # nodemon auto-reload
# API is live at http://localhost:8000/api
```

### 5 — Open the frontend

Open `frontend/index.html` (or any page) in a browser.  
With VS Code Live Server the origin is `http://127.0.0.1:5500` — already whitelisted in `.env.example`.

---

## Gmail App Passwords Setup

Standard Gmail passwords **will not work** with SMTP. You must create an App Password:

1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required)
3. Go to **App passwords** → create a new one (name it "Akrasia SMTP")
4. Copy the 16-character password into `SMTP_PASS` in `.env`

---

## API Endpoints

| Method | Path              | Description                   |
|--------|-------------------|-------------------------------|
| GET    | `/api/health`     | Server + DB health check      |
| POST   | `/api/contact`    | Submit a contact enquiry      |
| POST   | `/api/orders`     | Submit a project quote request|

### POST `/api/contact`

```json
{
  "name":     "Farhan Islam",
  "email":    "farhan@example.com",
  "message":  "I'd like to know more about your services.",
  "honeypot": ""
}
```

**Success `201`:**
```json
{ "success": true, "message": "Thank you — we will be in touch within 24 hours.", "id": "clx..." }
```

**Validation error `422`:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "A valid email address is required" }]
}
```

### POST `/api/orders`

Accepts all fields from `start.html`:  
`name`, `email`, `phone`, `company`, `service`, `projectType`, `budget`, `timeline`, `goals`, `notes`, `communication`, `referralSource`, `honeypot`

Required fields: `name`, `email`, `service`, `goals`

---

## Security Features

| Feature                        | Implementation                          |
|--------------------------------|-----------------------------------------|
| SQL Injection                  | Prisma parameterised queries (no raw SQL) |
| XSS prevention                 | Zod `.transform()` strips HTML tags from all inputs |
| Secure HTTP headers            | `helmet` middleware                     |
| CORS                           | Whitelist-based, blocks unlisted origins |
| Rate limiting (global)         | 20 requests / 15 min per IP            |
| Rate limiting (form submit)    | 5 submissions / 15 min per IP          |
| Bot / spam protection          | Hidden honeypot field in every form    |
| IP anonymisation               | SHA-256 hash stored, never raw IP      |
| Oversized payloads             | Express body parser capped at 20 KB    |
| Secret management              | All credentials in `.env`, never hardcoded |
| Error leak prevention          | Stack traces hidden in production      |
| Graceful shutdown              | `SIGTERM`/`SIGINT` handled cleanly     |

---

## Database Tables

### `contacts` — simple enquiries
`id · name · email · message · sourcePage · ipHash · userAgent · status · createdAt · updatedAt`

### `orders` — project quote requests
`id · name · email · phone · company · service · projectType · budget · timeline · goals · notes · communication · referralSource · sourcePage · ipHash · userAgent · status · createdAt · updatedAt`

### `logs` — security / audit log
`id · level · event · message · ipHash · orderId · meta · createdAt`

---

## Deployment

### Frontend → Vercel

```bash
# From repo root
vercel deploy frontend/
```

Set environment variable on Vercel:
```
# No env vars needed for the static frontend
```

After deploying, update `CORS_ORIGIN` in your backend `.env` to your Vercel URL:
```
CORS_ORIGIN=https://teamakrasia.vercel.app
```

And update `API_BASE` in `frontend/src/js/main.js` to your backend URL.

### Backend → Railway

1. Push the repo to GitHub
2. Create a new Railway project → **Deploy from GitHub**
3. Select the repo, set **Root Directory** to `backend/`
4. Add a **PostgreSQL** service in Railway
5. Add all environment variables from `.env.example`
6. Railway auto-runs `npm start` → `node src/app.js`

**Run migrations on Railway:**
```bash
railway run npm run db:migrate
```

### Backend → Docker (VPS)

```bash
# Set POSTGRES_PASSWORD in your shell or a .env file at the repo root
export POSTGRES_PASSWORD=your_secure_password

docker-compose up -d --build
```

Backend will be at `http://your-server:8000/api`.

---

## Prisma Commands

```bash
# Generate Prisma client after schema changes
npm run db:generate

# Apply migrations in development
npm run db:migrate:dev

# Apply migrations in production (CI/CD or Railway)
npm run db:migrate

# Open Prisma Studio (visual DB browser)
npm run db:studio
```

---

## Environment Variables Reference

See `backend/.env.example` for all variables with explanations.

| Variable             | Required | Description                                 |
|----------------------|----------|---------------------------------------------|
| `DATABASE_URL`       | ✅       | PostgreSQL connection string                |
| `SMTP_USER`          | ✅       | Gmail address for sending email             |
| `SMTP_PASS`          | ✅       | Gmail App Password (16-char)                |
| `PORT`               | –        | Server port (default: 8000)                 |
| `NODE_ENV`           | –        | `development` or `production`               |
| `CORS_ORIGIN`        | –        | Comma-separated allowed frontend origins    |
| `EMAIL_TO`           | –        | Recipient for notifications (default: teamtheakrasia@gmail.com) |
| `RATE_LIMIT_MAX`     | –        | Max requests per window (default: 20)       |
| `JWT_SECRET`         | –        | For future admin panel                      |

---

© 2025 Akrasia · Bangladesh
