build:
	docker build -t api/processos .
prod:
	docker run -p 3000:3000 -d api/processos
dev:
	docker-compose up
hidden:
	docker-compose up -d 
down:
	docker-compose down