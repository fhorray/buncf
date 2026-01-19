# Cloudflare D1 + Drizzle Example

This project demonstrates how to use Cloudflare D1 with Drizzle ORM in a `buncf` application.

## Features

- **Drizzle ORM**: Type-safe database access.
- **D1 Binding**: Configured in `wrangler.json`.
- **API Routes**: `GET` and `POST` handlers for user management.
- **Admin UI**: A simple interface to list and create users.

## How to Run

1.  **Install dependencies**:

    ```bash
    bun install
    ```

2.  **Local Development**:
    Start the dev server with local D1 emulation:

    ```bash
    bun dev
    ```

3.  **Deploy to Cloudflare**:
    ```bash
    bun deploy
    ```

## Project Structure

- `src/db/schema.ts`: Database table definitions.
- `src/db/index.ts`: Database client initialization.
- `src/api/users/index.ts`: API endpoints interacting with the DB.
- `src/pages/admin/users.tsx`: Frontend page for user management.
- `wrangler.json`: Cloudflare configuration with D1 binding.
