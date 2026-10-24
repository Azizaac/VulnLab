FROM node:24-alpine AS runtime
WORKDIR /srv
COPY --chown=node:node common.mjs contracts.json ./
USER node

FROM runtime AS shop
COPY --chown=node:node shop.mjs ./
EXPOSE 8080
CMD ["node", "shop.mjs"]

FROM runtime AS runner
COPY --chown=node:node runner.mjs ./
EXPOSE 8090
CMD ["node", "runner.mjs"]
