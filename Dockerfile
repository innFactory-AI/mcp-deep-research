FROM node:18-alpine

WORKDIR /app

COPY . .
COPY package.json ./
COPY .env.local ./.env.local

RUN npm install

EXPOSE 3000 3001

CMD ["sh", "-c", "npm run api & npm run mcp & wait"]
