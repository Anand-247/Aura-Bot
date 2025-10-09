This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Backend: MongoDB Setup

### 1) Environment

Create a `.env.local` in the project root with:

```
MONGODB_URI=mongodb://localhost:27017/aura_bot
```

For MongoDB Atlas, use the connection string from your cluster.

### 2) Install

Already added as dependency:

```
npm i mongoose
```

### 3) Connection utility

`src/lib/mongodb.ts` provides a cached connector for server code.

### 4) Models

`src/models/User.ts` defines a simple `User` model with `name` and `email`.

### 5) API routes

- Health: `GET /api/health` — checks DB connectivity
- Users: `GET /api/users`, `POST /api/users` — list and create users

Example:

```
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/users -H 'Content-Type: application/json' -d '{"name":"Ada","email":"ada@example.com"}'
```
# Aura-Bot
