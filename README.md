# rocky-web

[![CI](https://github.com/ChathuniPG/rocky-web/actions/workflows/ci.yml/badge.svg)](https://github.com/ChathuniPG/rocky-web/actions/workflows/ci.yml)

Frontend of **R.O.C.K.Y.** (Regular Online Content Kernel Yarn), a TikTok-style social media platform. Built with Next.js (App Router), TypeScript, Tailwind CSS and shadcn/ui. The API lives in the separate `rocky-api` repository.

> Placeholder. The full README (setup, architecture, scripts, deployment) follows in #16.

## Quick start

```bash
nvm use            # Node 26 (see .nvmrc)
npm install
cp .env.example .env.local   # optional; defaults work for local development
npm run dev        # http://localhost:3000, with /api proxied to rocky-api on 127.0.0.1:4000
```

See `docs/` for requirements, design and the API contract.
