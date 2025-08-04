# Generates a container to run the compiled node.js scripts in
# -> Runs as the "node" user so any extra folders will need to be chown-ed
# -> Uses a multi-stage to compile JavaScript and produce a slim image

# [0] A common base for both stages
FROM node:22-alpine AS base
WORKDIR /app
RUN chown -R node:node /app
USER node
COPY --chown=node ["package*.json", "tsconfig.json", "/app/"]
COPY --chown=node ["cli/package.json", "/app/cli/"]

# [1] A builder to install modules and run a build
FROM base AS builder
ENV NODE_ENV=development
RUN npm ci
COPY --chown=node ["cli", "/app/cli"]
RUN npm run --workspace=cli build
RUN wget -O- https://github.com/protomaps/go-pmtiles/releases/download/v1.28.0/go-pmtiles_1.28.0_Linux_x86_64.tar.gz | tar -xzC /tmp

# [2] From the base again, install production dependencies and copy compiled code
FROM base AS dist
ENV NODE_ENV=production
RUN npm ci -w cli && npm cache clean --force
COPY --from=builder --chown=node ["/app/cli/dist/", "/app/cli/"]
COPY --from=builder --chown=node ["/tmp/pmtiles", "/usr/local/bin/pmtiles"]
WORKDIR /app
ENTRYPOINT ["node", "cli/main.js"]
CMD ["run"]
