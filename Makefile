all: gutenberg install up

.PHONY: clean-gutenberg
clean-gutenberg:
	rm -f gutenberg.tar.bz2
	rm -rf gutenberg/

.PHONY: fetch-gutenberg
fetch-gutenberg:
	curl https://www.gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2 -o gutenberg.tar.bz2

.PHONY: gutenberg
gutenberg: fetch-gutenberg
	mkdir -p gutenberg
	tar xjvf gutenberg.tar.bz2 -C gutenberg

.PHONY: install
install:
	yarn install

.PHONY: up
up:
	docker-compose up -d

.PHONY: down
down:
	docker-compose down

.PHONY: logs
logs:
	docker-compose logs -f

.PHONY: db-admin
db-admin:
	xdg-open localhost:8081
