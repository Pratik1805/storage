#  ---------------- Stage1 : Dependencies -----------------------------
FROM node:20-alpine AS dependencies

# Install libc6-compat for compatibility with certain native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./

# Install dependencies ci (clean install, installing from package-lock.json and validation through package.json)
RUN npm ci 

# -------------------- Stage 2 : Builder ----------------------------

FROM node:20-alpine AS builder

WORKDIR /app 
# Copy only the node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .

# Pass Appwrite variables as build arguments 
# (Required for NEXT_PUBLIC_ vars to be bundled into the JS)
ARG NEXT_PUBLIC_APPWRITE_ENDPOINT
ARG NEXT_PUBLIC_APPWRITE_PROJECT

RUN echo "Endpoint is: ${NEXT_PUBLIC_APPWRITE_ENDPOINT}"

ENV NEXT_PUBLIC_APPWRITE_ENDPOINT=$NEXT_PUBLIC_APPWRITE_ENDPOINT
ENV NEXT_PUBLIC_APPWRITE_PROJECT=$NEXT_PUBLIC_APPWRITE_PROJECT
# Next.js collects completely anonymous telemetry data about general usage.
ENV NEXT_TELEMETRY_DISABLED 1 

RUN npm run build


# stage 3 : Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Set to production for performance optimizations
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1 

# Only copy what is strictly necessary from the builder stage
# This keeps the image size very small
# 1. Copy public assets (images, favicon)
COPY --from=builder /app/public ./public
# 2. Copy the bundled app (this is the 'standalone' output)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

ENV HOSTNAME "0.0.0.0"

EXPOSE 3000

CMD ["node", "server.js"]