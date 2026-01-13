all: up

up:	build
	docker compose -f ./srcs/docker-compose.yml up -d

down:
	docker compose -f ./srcs/docker-compose.yml down

stop:
	docker compose -f ./srcs/docker-compose.yml stop

start:
	docker compose -f ./srcs/docker-compose.yml start

build:
	docker compose -f ./srcs/docker-compose.yml build

clean:
	@docker stop $$(docker ps -aq) || true
	@docker rm $$(docker ps -aq) || true

	@docker rmi -f $$(docker images -aq) || true

	@docker volume rm $$(docker volume ls -q) || true

	@docker network rm $$(docker network ls -q) || true

add_stats:
	@if [ -z "$(user)" ]; then \
		echo "Error: enter user's alias. Example: make add_stats user=AnneChat"; \
	else \
		bash ./scripts/add_stats.sh $(user); \
	fi

re: clean up

prune:	clean
	rm -r ./srcs/back/datadev/
	@docker system prune -a --volumes -f