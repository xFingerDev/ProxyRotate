FROM node:23-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

FROM node:23-alpine AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

EXPOSE 3000

CMD ["node", "src/index.js"]
