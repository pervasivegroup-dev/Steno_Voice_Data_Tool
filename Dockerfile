# -------- configurable base (stick to LTS for servers) --------
ARG NODE_VERSION=20-alpine
ARG PNPM_VERSION=9.0.0

# ==============================================================
# deps stage — install node_modules with pnpm (fallback to npm)
# ==============================================================
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# Use pnpm when lockfile exists; otherwise npm
# (corepack is built-in on modern Node images)
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

# Copy only manifests first for better layer caching
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY package-lock.json* ./
COPY .npmrc* ./

# Install dependencies (pnpm preferred)
RUN if [ -f pnpm-lock.yaml ]; then \
      pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      npm ci; \
    else \
      npm install; \
    fi

# ==============================================================
# builder stage — copy source and run next build
# ==============================================================
FROM node:${NODE_VERSION} AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Bring installed deps from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copy full source (Tailwind & PostCSS configs included)
COPY . .

# Copy environment file if it exists
COPY .env.local* ./

# Build (pnpm if lockfile present)
RUN if [ -f pnpm-lock.yaml ]; then \
      corepack enable && pnpm build; \
    else \
      npm run build; \
    fi

# ==============================================================
# runner stage — minimal runtime image using standalone output
# ==============================================================
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Environment variables for RedCAP integration
# Set these via .env.local file or Docker environment variables:
# REDCAP_API_URL=https://your-redcap-instance.com/api/
# REDCAP_API_TOKEN=your_redcap_api_token_here

# Copy standalone server output + static assets + public
# (created by next build when output:'standalone' is set)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy environment file if it exists
COPY --from=builder /app/.env.local* ./

# Optional healthcheck (requires wget/curl; busybox wget is present)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:${PORT}/ >/dev/null 2>&1 || exit 1

# Next standalone creates server.js as the entry point
CMD ["node", "server.js"]
