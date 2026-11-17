FROM node:24-alpine AS runtime
WORKDIR /srv
COPY --chown=node:node *.mjs contracts.json Dockerfile Dockerfile.verifier compose.yaml package.json package-lock.json ./
USER node

FROM runtime AS shop
EXPOSE 8080
CMD ["node", "shop.mjs"]

FROM runtime AS runner
EXPOSE 8090
CMD ["node", "runner.mjs"]
