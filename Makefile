certs:
	echo "Generating SSL certificates..."
	mkdir -p srcs/certs
	chmod +x generate-certs.sh
	./generate-certs.sh

all: up

up:	build
	docker compose -f ./srcs/docker-compose.yml up -d

down:
	docker compose -f ./srcs/docker-compose.yml down

stop:
	docker compose -f ./srcs/docker-compose.yml stop

start:
	docker compose -f ./srcs/docker-compose.yml start

build: certs
	docker compose -f ./srcs/docker-compose.yml build

clean:
	@docker stop $$(docker ps -aq) || true
	@docker rm $$(docker ps -aq) || true

	@docker rmi -f $$(docker images -aq) || true

	@docker volume rm $$(docker volume ls -q) || true

	@docker network rm $$(docker network ls -q) || true
	@rm -rf srcs/certs/

re: clean up

prune:	clean
	rm -r ./srcs/back/datadev/
	@docker system prune -a --volumes -f