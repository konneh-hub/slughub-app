# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Local project setup

This repository contains a React frontend built with Vite and a Node/Express backend using Prisma.

### Frontend

1. Copy `.env.example` to `.env` in the project root if you need to customize the API base path.
2. Install dependencies from the workspace root:
   - `npm install`
3. Start the frontend dev server:
   - `npm run dev`

The frontend uses `VITE_API_BASE=/api` by default and proxies `/api` requests to the backend via `vite.config.js`.

### Backend

1. Change into the backend folder and install dependencies:
   - `cd backend && npm install`
2. Copy `backend/.env.example` to `backend/.env` and update values for your local MySQL database.
3. If your database password contains special characters such as `@`, encode them in the URL (for example, `Mk@15590` becomes `Mk%4015590`).
4. Generate Prisma client and migrate the database:
   - `npm run prisma:generate`
   - `npm run prisma:migrate`
5. Seed initial data:
   - `npm run prisma:seed`
6. Start the backend server from the backend folder:
   - `npm run dev`

You can also start only the backend from the repository root with:

- `npm run backend:dev`

### CORS and API proxy

- Backend CORS is configured to allow `http://localhost:5173` by default.
- Frontend development requests to `/api/*` are proxied to `http://localhost:4000`.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
