.PHONY: dev prod build-dev build-prod stop clean logs-dev logs-prod

# Development commands
dev:
	docker compose up dev

build-dev:
	docker compose build dev

logs-dev:
	docker compose logs -f dev

# Production commands
prod:
	docker compose up prod

build-prod:
	docker compose build prod

logs-prod:
	docker compose logs -f prod

# Utility commands
stop:
	docker compose down

clean:
	docker compose down -v --rmi all
	docker system prune -f

restart-dev:
	docker compose restart dev

restart-prod:
	docker compose restart prod