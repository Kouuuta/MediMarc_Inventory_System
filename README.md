# MediMarc — Inventory & Sales Management System

It's a web-based inventory and sales management system for a medical supply distributor. Staff can log in with role-based accounts — **superadmin, admin, or regular user** — and manage products, categories, customers, and sales. Every product tracks stock by **batch** — lot number, expiration date, shipment date — since it's medical inventory where traceability matters. Stock only gets deducted once a sale is actually marked **"Delivered"**, not when it's created, so pending or cancelled orders don't wrongly eat into available stock. There's also a **low-stock alert system** based on a per-product critical stock threshold, an **activity log** that audits who created, updated, or deleted what, and **CSV/PDF report generation** for sales and shipments. It's built with **Django REST Framework** on the backend and **React** on the frontend, with **JWT authentication**.

> The project source lives in [`MediMarc/`](MediMarc/). The backend project package was renamed from `backend` → `config` (run commands below reflect that).

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 6, Tailwind CSS v4, shadcn/ui, Recharts, Lucide icons |
| Backend | Django 5, Django REST Framework, SimpleJWT, django-filter, django-cors-headers |
| Database | SQLite (single file — easy dev/demo) |
| Email | Gmail SMTP (password reset), Resend API key |
| Reports | reportlab (PDF) + streaming CSV |

## Features

- **Role-based login** — `SUPERADMIN`, `ADMIN`, `USER`; role gates what each account can see and do.
- **Products by batch** — each product tracks `lot_number`, `expiration_date`, `shipment_date`; a SKU can span multiple stock rows when restocked.
- **Stock integrity** — stock is only deducted (atomically, with row locking) when a sale moves to **Delivered**. Pending/Cancelled orders never reduce stock.
- **Critical stock alerts** — a per-product `critical_stock` threshold; the dashboard surfaces items whose aggregated stock is at or below it.
- **Activity log** — django-easyaudit records who created/updated/deleted what, surfaced in the app.
- **Reporting** — sales report filtered by date/customer/item code as CSV or PDF; product/shipment CSV export.
- **Auth flows** — JWT login with refresh tokens, logout with token blacklisting, and an emailed forgot/reset-password flow.

## Architecture

```
 ┌──────────────┐   HTTP / JSON    ┌──────────────────────┐   Django ORM   ┌───────────┐
 │   Browser    │ ────────────────► │  Django REST API     │ ─────────────► │  SQLite   │
 │  React SPA   │   JWT Bearer      │  http://localhost:   │                │ db.sqlite3│
 │ (Vite :5173) │ ◄──────────────── │  8000/api/           │ ◄───────────── │           │
 └──────────────┘   JSON responses  └──────────────────────┘                └───────────┘
                                         ▲  axios instance in frontend/src/lib/api.js
                                         │  injects Authorization: Bearer <token>
```

- Frontend dev server: `http://localhost:5173`
- Django API: `http://localhost:8000/api/` (Django admin at `http://localhost:8000/admin/`)

## Repository layout

```
SE_Project/
├── MediMarc/
│   ├── backend/           # Django REST Framework project
│   │   ├── api/           #   models, serializers, views, urls, tests, admin
│   │   ├── config/        #   settings, root urls (renamed from `backend`)
│   │   ├── requirements.txt
│   │   └── .env.example   #   secret-free env template (copy to .env)
│   ├── frontend/          # React + Vite SPA
│   │   └── src/
│   │       ├── pages/     #   {auth, dashboard, inventory, admin}
│   │       ├── components/{layout, common, ui}
│   │       └── lib/       #   api.js + utils.js
│   └── docs/
│       └── REVAMP_CHECKLIST.md   # audit of fixes & design decisions
└── README.md              # you are here
```

See [`MediMarc/frontend/README.md`](MediMarc/frontend/README.md) for the frontend and [`MediMarc/backend/README.md`](MediMarc/backend/README.md) for the backend.

## Getting started

### 1. Backend (Django REST API)

```bash
cd MediMarc/backend

# Create & activate a virtual environment
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env          # then fill in SECRET_KEY, email/Resend values

# Prepare the database (fresh clone: creates tables + migrations)
python manage.py migrate

# Run the API
python manage.py runserver      # -> http://localhost:8000/api/
```

> A `db.sqlite3` from development is gitignored; on a fresh clone, run `python manage.py migrate`. To create an administrator from scratch use `python manage.py createsuperuser`.

### 2. Frontend (React SPA)

```bash
cd MediMarc/frontend

# Install dependencies
npm install

# Environment (optional overrides)
# VITE_API_URL defaults to http://localhost:8000/api/

# Run the dev server
npm run dev                     # -> http://localhost:5173
```

### 3. Log in

**Default admin account (dev database):**

| Username | Password | Role |
| --- | --- | --- |
| `demo` | `demo123` | ADMIN |

> This account exists in the local dev `db.sqlite3`. For a fresh setup, create your own via `createsuperuser`.

## Roles & permissions

| Role | Capabilities |
| --- | --- |
| **SUPERADMIN** | Everything (equivalent to Django superuser). |
| **ADMIN** | Manage products, categories, customers, sales, and create/edit users. |
| **USER** | Standard staff operations on inventory and sales. |

Role gating is enforced in the API views (`request.user.is_superuser` / `user_type == "ADMIN"`).

## Scripts & testing

**Backend**

```bash
cd MediMarc/backend
venv\Scripts\python.exe manage.py check      # system checks
venv\Scripts\python.exe manage.py test api   # 5 tests (sales/stock + low-stock)
```

**Frontend**

```bash
cd MediMarc/frontend
npm run dev        # start dev server
npm run build      # production build (vite build)
npm run lint       # ESLint (0 errors expected)
```

## Documentation

- [`MediMarc/frontend/README.md`](MediMarc/frontend/README.md) — routes, pages, components, API integration.
- [`MediMarc/backend/README.md`](MediMarc/backend/README.md) — data model, full API endpoint reference, auth & stock logic.
- [`MediMarc/docs/REVAMP_CHECKLIST.md`](MediMarc/docs/REVAMP_CHECKLIST.md) — record of security fixes, bug fixes, and the Tailwind v4 / shadcn-ui redesign.
