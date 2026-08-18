FROM node:24-bookworm-slim

WORKDIR /app

# better-sqlite3 and bcrypt may need native build tools on a new architecture.
RUN apt-get update \
  && apt-get install --no-install-recommends -y python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN mkdir -p /app/data /app/backups \
  && chown -R node:node /app

ENV NODE_ENV=production \
    PORT=5000 \
    DATABASE_PATH=/app/data/inventory.db

USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "index.js"]
