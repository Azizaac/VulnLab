FROM php:8.4-fpm-alpine AS php-base
RUN apk add --no-cache icu-libs libzip oniguruma sqlite-libs libpng libjpeg-turbo libwebp \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev libzip-dev oniguruma-dev sqlite-dev libpng-dev libjpeg-turbo-dev libwebp-dev \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install pdo_mysql pdo_sqlite intl zip mbstring gd \
    && apk del .build-deps
WORKDIR /var/www/html

FROM php-base AS dependencies
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction --optimize-autoloader

FROM node:24-alpine AS assets
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY resources ./resources
COPY vite.config.ts tsconfig.json ./
RUN npx vite build

FROM php-base AS app
RUN addgroup -g 10001 vulnlab && adduser -D -u 10001 -G vulnlab vulnlab
COPY --chown=vulnlab:vulnlab . .
COPY --from=dependencies --chown=vulnlab:vulnlab /var/www/html/vendor ./vendor
COPY --from=assets --chown=vulnlab:vulnlab /app/public/build ./public/build
COPY docker/php.ini /usr/local/etc/php/conf.d/vulnlab.ini
RUN mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && chown -R vulnlab:vulnlab storage bootstrap/cache \
    && sed -i 's/^user = .*/user = vulnlab/; s/^group = .*/group = vulnlab/' /usr/local/etc/php-fpm.d/www.conf
USER 10001:10001
EXPOSE 9000
CMD ["php-fpm", "-F"]

FROM app AS testing
USER root
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
RUN touch .env && COMPOSER_ALLOW_SUPERUSER=1 composer install --prefer-dist --no-interaction --optimize-autoloader \
    && chown -R vulnlab:vulnlab storage bootstrap/cache
USER 10001:10001

FROM nginxinc/nginx-unprivileged:1.28-alpine AS web
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=app /var/www/html/public /var/www/html/public
USER 101:101
EXPOSE 8080
