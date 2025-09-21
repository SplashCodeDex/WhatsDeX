# Gemini Context: WhatsDeX Project

## 1. Project Overview

**WhatsDeX** is a comprehensive, multi-service WhatsApp automation platform. The core of the project is a powerful and extensible WhatsApp bot built with Node.js and the `@whiskeysockets/baileys` library. The platform also includes several web-based front-ends for administration, management, and user interaction, built with Next.js.

The project is designed with a modular, microservices-like architecture, intended to be orchestrated with Docker.

### Core Technologies:
- **Backend (Bot):** Node.js, Express.js, Baileys
- **Frontend (Web, Admin, GUI):** Next.js, React, Tailwind CSS
- **Database:** PostgreSQL (managed with Prisma ORM)
- **Caching:** Redis (for sessions and caching)
- **Orchestration:** Docker Compose (primary), PM2 (secondary)
- **Testing:** Jest (unit/integration), Playwright (end-to-end)

### Architecture:
The system is composed of several distinct services:
- `whatsdex-bot`: The main bot application that connects to WhatsApp.
- `whatsdex-postgres`: The primary PostgreSQL database.
- `whatsdex-redis`: The Redis instance for caching and session storage.
- `web`: A Next.js user-facing dashboard.
- `admin`: A Next.js admin panel for management.
- `gui`: Another Next.js application with an unspecified purpose.

These services are designed to run in concert, orchestrated by `docker-compose.yml`.

## 2. Building and Running

The project can be run in several ways, but the primary intended method for unified launch is Docker Compose.

### Primary Method (Docker)
This is the recommended approach for starting all services at once.

```bash
# Build all the service images defined in the docker-compose.yml
docker-compose build

# Start all services in detached mode
docker-compose up -d
```

### Alternative Method (PM2)
For running the main bot as a background service without Docker.

```bash
# Start the bot using the ecosystem configuration
npm run start:pm2
```

### Local Development
To run services individually for development.

```bash
# Run the main bot with hot-reloading
npm run dev

# In a separate terminal, navigate to a frontend directory and start it
cd admin
npm run dev # Starts the admin dashboard (e.g., on port 3001)
```

### Testing
The project uses Jest and Playwright for testing.

```bash
# Run unit and integration tests
npm test

# Run end-to-end tests
npm run e2e
```

## 3. Development Conventions

### Code Style
- **JavaScript:** Adheres to the **StandardJS** style guide.
- **Linting:** Use `npm run lint` to check for style issues.

### Database
- **Schema:** The database schema is managed by Prisma and is defined in `prisma/schema.prisma`.
- **Migrations:** To create and apply database migrations, use the Prisma CLI:
  ```bash
  # Create a new migration based on schema changes
  npx prisma migrate dev --name <migration-name>
  ```

### Commits & Contributions
- **Commit Messages:** Follow the imperative mood ("Add feature", not "Added feature"). The first line should be concise.
- **Branching:** Create feature branches from `main` (e.g., `feature/your-feature-name`).
- **Pull Requests:** Open PRs against the `main` branch.
- **Contribution Guide:** Refer to `CONTRIBUTING.md` for full details.

### Project Management
- `ToDo.md`: Tracks future features, enhancements, and suggestions.
- `RELEASE_MANUSCRIPT.md`: Documents significant architectural decisions and feature implementations.
