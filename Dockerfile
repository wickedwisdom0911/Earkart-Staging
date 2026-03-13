FROM node:18-alpine AS base
# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/ui/package.json ./packages/ui/
COPY turbo.json ./
RUN pnpm install --frozen-lockfile
# Build
FROM base AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules
COPY --from=deps /app/packages/eslint-config/node_modules ./packages/eslint-config/node_modules
RUN pnpm run build
# Resolve pnpm symlinks in standalone node_modules so the runner stage works.
# Step 1: top-level symlinks (e.g. "next", "react") — same logic as before.
# Step 2: scoped package symlinks (e.g. "@aws-sdk/client-s3") — NEW addition.
RUN cd /app/apps/dashboard/.next/standalone/node_modules \
    && for mod in *; do \
         [ -L "$mod" ] || continue; \
         rm "$mod"; \
         pkg=$(find /app/node_modules/.pnpm \
               -path "*/node_modules/$mod/package.json" 2>/dev/null | head -1); \
         if [ -n "$pkg" ]; then \
           store_nm=$(dirname "$(dirname "$pkg")"); \
           for dep in "$store_nm"/*; do \
             dep_name=$(basename "$dep"); \
             [ -e "$dep_name" ] && ! [ -L "$dep_name" ] && continue; \
             [ -L "$dep_name" ] && rm "$dep_name"; \
             cp -rL "$dep" "$dep_name" 2>/dev/null || true; \
           done; \
         fi; \
       done \
    && for scope_dir in /app/node_modules/@*/; do \
         scope=$(basename "$scope_dir"); \
         mkdir -p "$scope"; \
         for pkg_dir in "$scope_dir"*/; do \
           pkg=$(basename "$pkg_dir"); \
           if [ ! -d "$scope/$pkg" ] || [ -L "$scope/$pkg" ]; then \
             rm -rf "$scope/$pkg" 2>/dev/null || true; \
             cp -rL "$pkg_dir" "$scope/$pkg" 2>/dev/null || true; \
           fi; \
         done; \
       done \
    && cp -r /app/apps/dashboard/.next/standalone /app/standalone
# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# Copy resolved standalone (symlinks already resolved in builder)
COPY --from=builder --chown=nextjs:nodejs /app/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/public ./public
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]