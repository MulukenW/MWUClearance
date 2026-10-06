#!/bin/sh
set -e

if [ -z "$APP_KEY" ]; then
    echo "==> APP_KEY not provided, generating temporary key..."
    php artisan key:generate --force || true
fi

echo "==> Caching configuration and routes..."
php artisan config:clear || true
php artisan route:clear || true

echo "==> Running database migrations..."
if ! php artisan migrate --force; then
    echo "==> [WARNING] Database migration failed. Check your DB credentials in Render Environment tab."
fi

echo "==> Seeding essential roles & data (if needed)..."
php artisan db:seed --force || true

echo "==> Creating storage symlink..."
php artisan storage:link || true

echo "==> Starting web server on port ${PORT:-8080}..."
exec php artisan serve --host=0.0.0.0 --port="${PORT:-8080}"
