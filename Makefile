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

# Clean only this app's volumes and images
clean:
	# stop containers
	docker compose down
	# remove images built for this compose project (by label)
	-docker image prune -f --filter "label=com.docker.compose.project=$(shell basename $(PWD))"
	# remove named volumes created for this project (name starts with project name)
	-docker volume rm -f $$(docker volume ls -q --filter "name=$(shell basename $(PWD))_*") || true

restart-dev:
	docker compose down dev || true
	docker compose up --build --force-recreate dev

restart-prod:
	docker compose down prod || true
	docker compose up --build --force-recreate -d prod
