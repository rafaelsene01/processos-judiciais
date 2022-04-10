FROM node:alpine

WORKDIR /app

COPY package*.json .

RUN npm i --silent

COPY . .

RUN npm run build

EXPOSE 3333

CMD npm serve
