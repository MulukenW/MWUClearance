# Deployment Guide — MWU Student Clearance System

## Prerequisites

| Component | Minimum Version |
| --------- | --------------- |
| PHP       | 7.4+            |
| MySQL     | 5.7+            |
| Composer  | 2.x             |
| Node.js   | 16+             |
| npm       | 8+              |

---

## 1. Backend Deployment (Laravel)

### 1.1 Clone & Install

```bash
cd /var/www/clearance/backend
composer install --no-dev --optimize-autoloader
```

### 1.2 Environment Configuration

Copy `.env.example` to `.env` and update:

```env
APP_NAME="MWU Clearance System"
APP_ENV=production
APP_KEY=base64:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=clearance_db
DB_USERNAME=clearance_user
DB_PASSWORD=strong_password_here

MAIL_MAILER=smtp
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USERNAME=your-email
MAIL_PASSWORD=your-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@your-domain.com
MAIL_FROM_NAME="${APP_NAME}"

FRONTEND_URL=https://your-domain.com
```

### 1.3 Generate App Key

```bash
php artisan key:generate
```

### 1.4 Run Migrations & Seeders

```bash
php artisan migrate --force
php artisan db:seed --force
```

### 1.5 Cache Optimization

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 1.6 File Permissions

```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 1.7 Apache Configuration

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/clearance/backend/public

    <Directory /var/www/clearance/backend/public>
        AllowOverride All
        Require all granted
    </Directory>

    # Redirect to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>
```

### 1.8 Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/clearance/backend/public;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

---

## 2. Frontend Deployment (React/Vite)

### 2.1 Build for Production

```bash
cd /var/www/clearance/frontend

# Set production API URL
echo "VITE_API_URL=https://your-domain.com/api" > .env.production

# Install dependencies
npm install

# Build
npm run build
```

The output will be in `dist/` directory.

### 2.2 Serve Static Files

**Option A: Serve from Laravel public directory**

```bash
cp -r dist/* /var/www/clearance/backend/public/app/
```

Then access at `https://your-domain.com/app/`

**Option B: Serve with Nginx (recommended)**

```nginx
server {
    listen 80;
    server_name app.your-domain.com;
    root /var/www/clearance/frontend/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy to Laravel backend
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 3. Database Setup

### 3.1 Create Database

```sql
CREATE DATABASE clearance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'clearance_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON clearance_db.* TO 'clearance_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3.2 Production MySQL Tuning

Add to `/etc/mysql/my.cnf`:

```ini
[mysqld]
innodb_buffer_pool_size = 256M
max_connections = 200
query_cache_size = 32M
```

---

## 4. Security Checklist

- [ ] `APP_DEBUG=false` in production
- [ ] `APP_ENV=production` in production
- [ ] Strong `APP_KEY` generated
- [ ] Strong database password
- [ ] HTTPS enabled (SSL certificate)
- [ ] CORS restricted to frontend domain only
- [ ] Security headers middleware active (X-Content-Type-Options, X-Frame-Options, etc.)
- [ ] Rate limiting enabled on API routes
- [ ] File permissions set correctly
- [ ] `.env` file not accessible via web
- [ ] `php artisan config:cache` run
- [ ] `php artisan route:cache` run

---

## 5. Default Accounts

After running seeders, these accounts are available:

| Email                | Password | Role                 |
| -------------------- | -------- | -------------------- |
| admin@mwu.edu.et     | password | System Administrator |
| advisor@mwu.edu.et   | password | Academic Advisor     |
| head@mwu.edu.et      | password | Department Head      |
| lab@mwu.edu.et       | password | Laboratory           |
| library@mwu.edu.et   | password | Library              |
| dormitory@mwu.edu.et | password | Dormitory            |
| police@mwu.edu.et    | password | Police               |
| registrar@mwu.edu.et | password | Registrar            |

**Important:** Change all default passwords after first login.

---

## 6. Troubleshooting

### Backend returns 500 errors

- Check `storage/logs/laravel.log`
- Verify database connection in `.env`
- Run `php artisan config:clear` then `php artisan config:cache`

### Frontend shows blank page

- Check browser console for errors
- Verify `VITE_API_URL` in `.env.production`
- Ensure `npm run build` completed successfully

### CORS errors in browser

- Verify `FRONTEND_URL` in backend `.env`
- Run `php artisan config:cache` after changes
- Check `config/cors.php` allowed_origins

### API proxy not working in production

- Verify Nginx `proxy_pass` configuration
- Ensure Laravel is accessible at the proxy target
- Check Nginx error logs

---

## 7. Project Structure

```
Clerance/
├── backend/                    # Laravel 8 API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   │   ├── AuthController.php
│   │   │   │   ├── AdminController.php
│   │   │   │   ├── AdminManagementController.php
│   │   │   │   ├── AdminWorkflowController.php
│   │   │   │   ├── CertificateController.php
│   │   │   │   ├── ClearanceController.php
│   │   │   │   ├── NotificationController.php
│   │   │   │   ├── ReportsController.php
│   │   │   │   ├── StudentController.php
│   │   │   │   ├── VerificationController.php
│   │   │   │   └── WebAuthnController.php
│   │   │   ├── Middleware/
│   │   │   │   ├── RoleMiddleware.php
│   │   │   │   ├── SecurityHeaders.php
│   │   │   │   └── DepartmentAuthorizationMiddleware.php
│   │   │   └── Resources/      # API response formatters
│   │   ├── Models/             # Eloquent models
│   │   └── Services/           # Business logic services
│   ├── database/
│   │   └── migrations/         # Database schema
│   ├── routes/
│   │   └── api.php             # All API routes (~90 endpoints)
│   └── config/
│       └── cors.php            # CORS configuration
│
└── frontend/                   # React 18 + Vite + Tailwind CSS v4
    ├── src/
    │   ├── components/         # 15 reusable UI components
    │   ├── pages/
    │   │   ├── admin/          # 11 admin pages
    │   │   ├── officer/        # 4 officer pages
    │   │   └── student/        # 4 student pages
    │   ├── layouts/            # AppLayout, AuthLayout
    │   ├── services/           # API service layer
    │   ├── contexts/           # AuthContext
    │   ├── routes/             # ProtectedRoute
    │   ├── utils/              # Helpers
    │   ├── constants/          # App constants
    │   ├── App.jsx             # Router (all routes)
    │   └── main.jsx            # Entry point
    └── dist/                   # Production build output
```

---

## 8. Quick Start (Development)

```bash
# Terminal 1: Backend
cd Clerance/backend
php artisan serve --port=8000

# Terminal 2: Frontend
cd Clerance/frontend
npm run dev
```

Open `http://localhost:5173` in your browser.
