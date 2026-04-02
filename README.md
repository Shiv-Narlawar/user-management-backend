# User Management Backend

Express + TypeScript backend for the User Management System. It provides authenticated APIs for users, departments, roles, permissions, dashboard stats, and audit logs, with authorization enforced through RBAC permissions.

## Tech Stack

- Node.js
- Express 5
- TypeScript
- PostgreSQL
- TypeORM
- Auth0 JWT verification
- Jest

## Features

- Authenticated `/auth/me` endpoint
- RBAC permission checks on protected routes
- User management APIs
- Department management and user assignment APIs
- Role and permission management APIs
- Dashboard stats endpoint
- Audit log endpoint
- TypeORM migrations
- Seed scripts for roles, permissions, role-permission mappings, and admin user

## Project Structure

```text
src/
  config/         Data source configuration
  constants/      Permission and role constants
  controllers/    Express controllers
  entities/       TypeORM entities
  middleware/     Auth, permission, async, and error middleware
  migrations/     Database migrations
  routes/         API route definitions
  seeds/          Seed scripts
  services/       Business logic and Auth0 helpers
  validators/     Request validation
tests/
  auth/           Authentication tests
  user/           User service tests
```

## API Base URL

Local API base URL:

```text
http://localhost:7000/api
```

Health endpoints:

- `GET /health`
- `GET /api/health`

## Main Routes

All routes below are mounted under `/api`.

### Auth

- `GET /auth/me`

### Users

- `GET /users`
- `POST /users`
- `PUT /users/:id`
- `DELETE /users/:id`
- `PATCH /users/me`
- `GET /users/managers`
- `GET /users/unassigned`
- `GET /users/unassigned-managers`

### Departments

- `GET /departments`
- `POST /departments`
- `PUT /departments/:id`
- `DELETE /departments/:id`
- `POST /departments/:id/assign-manager`
- `POST /departments/:id/assign-user`
- `DELETE /departments/:id/remove-user/:userId`

### Roles

- `GET /roles`
- `POST /roles`
- `GET /roles/:id/permissions`
- `PUT /roles/:id/permissions`
- `DELETE /roles/:id`

### Permissions

- `GET /permissions`
- `POST /permissions`
- `DELETE /permissions/:id`

### Dashboard

- `GET /dashboard/stats`

### Audit

- `GET /audit`

## Authorization Model

Authentication is handled by bearer tokens validated in `authMiddleware`. Authorization is then enforced with permission checks such as:

- `USER_VIEW`
- `USER_CREATE`
- `USER_UPDATE`
- `USER_DELETE`
- `ROLE_CREATE`
- `ROLE_UPDATE`
- `PERMISSION_VIEW`
- `PERMISSION_CREATE`
- `PERMISSION_DELETE`
- `PERMISSION_ASSIGN`
- `DEPARTMENT_VIEW`
- `DEPARTMENT_CREATE`
- `DEPARTMENT_UPDATE`
- `DEPARTMENT_DELETE`
- `DEPARTMENT_ASSIGN_USER`
- `AUDIT_VIEW`

Permission names are defined in [src/constants/permission-name.ts](./src/constants/permission-name.ts).

## Environment Variables

Create a `.env` file in `user-management-backend/` and configure:

```env
PORT=7000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=user_management

FRONTEND_URL=http://localhost:5173
RUN_SEEDS=true

AUTH0_DOMAIN=your-auth0-domain
AUTH0_AUDIENCE=https://user-management-api
AUTH0_ISSUER_BASE_URL=https://your-auth0-domain/
AUTH0_MGMT_CLIENT_ID=your-management-client-id
AUTH0_MGMT_CLIENT_SECRET=your-management-client-secret
```

Notes:

- `RUN_SEEDS=true` seeds roles, permissions, role-permission mappings, and the default admin user on startup.
- `FRONTEND_URL` is appended to the CORS allowlist in addition to common localhost origins.
- Exact Auth0 variable names should match what your auth service helpers expect in this codebase.

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- PostgreSQL
- Auth0 API/application configuration

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

The server initializes the database connection, optionally runs seed scripts, and starts on `http://0.0.0.0:7000` by default.

## Scripts

- `npm run dev` run the server with `nodemon` and `ts-node`
- `npm run build` compile TypeScript to `dist/`
- `npm run start` run the compiled server
- `npm run start:prod` run the compiled server in production mode
- `npm test` run Jest tests
- `npm run migration:generate:dev` generate a development migration
- `npm run migration:run:dev` run migrations from TypeScript source
- `npm run migration:run` run migrations against the production build
- `npm run migration:revert:dev` revert the last development migration

## Database

The data source is configured in [src/config/data-source.ts](./src/config/data-source.ts). The backend uses PostgreSQL with `synchronize: false`, so schema changes should be managed through migrations.

Core entities currently include:

- users
- roles
- permissions
- departments
- refresh tokens
- audit logs

## Testing

Run the test suite with:

```bash
npm test
```

Current tests live under [tests/auth](./tests/auth) and [tests/user](./tests/user).

## Important Files

- [src/server.ts](./src/server.ts) startup flow, database init, and seeding
- [src/app.ts](./src/app.ts) Express app, CORS config, route mounting, and health endpoints
- [src/config/data-source.ts](./src/config/data-source.ts) TypeORM configuration
- [src/middleware/auth.middleware.ts](./src/middleware/auth.middleware.ts) token authentication
- [src/middleware/permission.middleware.ts](./src/middleware/permission.middleware.ts) permission authorization

## Operational Notes

- The backend currently allows a fixed set of localhost origins plus `FRONTEND_URL`.
- Most application routes are protected and require a valid bearer token.
- Authorization rules live in route definitions, so route changes should be reflected in this README.
