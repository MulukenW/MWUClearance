#!/bin/sh
set -e

echo "==> Caching configuration and routes..."
php artisan config:clear || true
php artisan route:clear || true

echo "==> Running database migrations..."
php artisan migrate --force

echo "==> Seeding essential roles & data (if needed)..."
php artisan db:seed --force || true

echo "==> Creating storage symlink..."
php artisan storage:link || true

echo "==> Starting web server on port ${PORT:-8080}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
