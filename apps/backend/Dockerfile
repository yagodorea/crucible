# Build backend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# Run stage
FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY data/ ./data/

# Copy pre-built frontend (built by CI workflow)
COPY public/ ./dist/public/

EXPOSE 5001

CMD ["node", "dist/index.js"]
