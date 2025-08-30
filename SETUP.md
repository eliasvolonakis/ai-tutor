# Setup

## Overview
This project uses Bun and Elysia (https://elysiajs.com). Bun is a fast JavaScript runtime like Node. Elysia is a minimal, high-performance web framework for Bun.

## Create your .env
1. Copy the example file:

```sh
cp .env.example .env
```

2. Edit `.env` and set values (database password, ports, etc.). Do not commit `.env`.

## Docker (recommended)
- Build and run dev container:

```sh
make build-dev
make dev
```

- Build and run production container:

```sh
make build-prod
make prod
```

- Stop all containers:

```sh
make stop
```

## Where to look
- App entry: `src/index.ts`
- Dev Dockerfile: `Dockerfile.dev`
- Prod Dockerfile: `Dockerfile.prod`
- Compose: `docker-compose.yml`
- Makefile: `Makefile`

## Notes
- `.env` is ignored by git. Use `.env.example` as the template.
- Elysia docs: https://elysiajs.com
- Bun docs: https://bun.sh
