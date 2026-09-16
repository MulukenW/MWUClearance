# MWU Student Clearance System

Clearance management system for Madda Walabu University — students request
clearance, officers review it per office, and the registrar issues the final
certificate.

## Stack

| Layer    | Tech                                            |
| -------- | ----------------------------------------------- |
| Backend  | Laravel (PHP 7.4+), MySQL, Sanctum auth         |
| Frontend | React 18, Vite 6, Tailwind CSS 4, React Router  |

## Project layout

```
backend/    Laravel API (routes, controllers, seeders, migrations)
frontend/   React SPA (pages, components, services)
```

## Quick start (local development)

### Backend

```bash
cd backend
composer install
cp .env.example .env        # then set DB credentials
php artisan key:generate
php artisan migrate --seed  # creates mwu_clearance database data
php artisan serve           # http://127.0.0.1:8000
```

Seeded admin: `admin@mwu.edu.et` / `password`

### Frontend

```bash
cd frontend
npm install
npm run dev                 # http://127.0.0.1:5173 (proxies /api → :8000)
```

`frontend/.env.development` points the dev build at the Vite proxy (`/api`),
so no CORS setup is needed locally. Production builds use
`frontend/.env.production` (Railway API URL).

## Deployment

- **Frontend:** Vercel → https://mwu-clearance.vercel.app
- **Backend API:** Railway

## System roles (13)

`admin`, `student`, `advisor`, `department_head`, `laboratory`, `library`,
`dormitory`, `police`, `registrar`, `cafeteria`, `student_service`,
`cost_sharing`, `continuing_education`
