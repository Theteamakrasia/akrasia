# Deployment Guide

## Option A — Static Hosting (Current)
Best for: frontend-only MVP

1. Push code to GitHub
2. Connect repo to **Netlify**, **Vercel**, or **GitHub Pages**
3. Point your domain's DNS to the host

## Option B — VPS with Docker (Future — Full Stack)

```bash
# 1. SSH into your server
ssh user@your-server-ip

# 2. Clone the repo
git clone https://github.com/your-org/startup-project.git

# 3. Run setup
cd startup-project
./infra/scripts/setup.sh

# 4. Deploy
./infra/scripts/deploy.sh
```

## Environment Variables
Copy `.env.example` files to `.env` and fill in real values before deploying.
