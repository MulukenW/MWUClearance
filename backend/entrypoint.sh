#!/bin/sh
set -e

if [ -z "$APP_KEY" ]; then
    echo "==> APP_KEY not provided, generating temporary key..."
    php artisan key:generate --force || true
fi

# Database auto-configuration
case "$DB_HOST" in
  *.*)
    echo "==> Using external database host: $DB_HOST"
    ;;
  *)
    echo "==> DB_HOST ('$DB_HOST') is not a remote host. Using self-contained SQLite database on Render..."
    export DB_CONNECTION=sqlite
    export DB_DATABASE=/app/database/database.sqlite
    mkdir -p /app/database
    touch /app/database/database.sqlite
    chmod 666 /app/database/database.sqlite
    ;;
esac

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
