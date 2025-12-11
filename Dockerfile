
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./


RUN if [ -f package-lock.json ]; then npm ci; else echo "No package-lock.json found, running npm install"; npm install; fi


FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build
RUN npm run build:worker



FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm","run","start"]