# MediMarc Backend

Django 5 + Django REST Framework API for the MediMarc inventory system. Provides JWT authentication, CRUD for products/categories/customers/sales, stock-batch logic, low-stock alerts, activity auditing, and CSV/PDF reporting.

## Project layout

```
backend/
├── manage.py             # Django CLI (DJANGO_SETTINGS_MODULE=config.settings)
├── requirements.txt
├── .env.example          # secret-free template — copy to .env
├── .env                  # real secrets (gitignored)
├── config/               # Django project package (renamed from `backend`)
│   ├── settings.py       # env-driven settings (python-decouple)
│   ├── urls.py           # /admin/ + /api/ include('api.urls')
│   ├── asgi.py           # ASGI entrypoint
│   └── wsgi.py           # WSGI entrypoint
└── api/
    ├── models.py         # CustomUser, Product, Category, Customer, Sale
    ├── serializers.py    # DRF serializers (incl. LoginSerializer)
    ├── views.py          # all API views/functions
    ├── urls.py           # every /api/… route
    ├── admin.py          # Django admin registrations
    ├── tests.py          # 5 API tests
    └── migrations/       # 0001_initial … 0008
```

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
pip install -r requirements.txt
copy .env.example .env           # fill in real values (SECRET_KEY etc.)

python manage.py migrate
python manage.py runserver       # http://localhost:8000/api/
```

Run checks and tests:

```bash
venv\Scripts\python.exe manage.py check
venv\Scripts\python.exe manage.py test api
```

Django admin: `http://localhost:8000/admin/` (log in as a superuser).

## Environment variables

Defined in `config/settings.py` via `python-decouple`; see `.env.example`.

| Variable | Configures |
| --- | --- |
| `SECRET_KEY` | Django signing/security key (generate a fresh one for production) |
| `DEBUG` | `True`/`False` (defaults to `False`) |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts (default `localhost,127.0.0.1`) |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins (default React dev server `http://localhost:5173`) |
| `FRONTEND_URL` | Frontend base URL used when building password-reset links |
| `EMAIL_HOST` | SMTP host (default `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (default `587`) |
| `EMAIL_USE_TLS` | SMTP TLS on/off |
| `EMAIL_HOST_USER` | SMTP sender address |
| `EMAIL_HOST_PASSWORD` | SMTP app password |
| `RESEND_API_KEY` | Resend email API key |

> `frontend/.env` separately defines `VITE_API_URL` / `VITE_RESEND_API_KEY`.

## Data model (`api/models.py`)

| Model | Key fields | Notes |
| --- | --- | --- |
| `CustomUser` | `username`, `email`, `user_type` (`SUPERADMIN`/`ADMIN`/`USER`), superuser flags | Custom auth user; `AUTH_USER_MODEL = "api.CustomUser"` |
| `Product` | `item_code`, `product_name`, `category`, `buying_price`, `selling_price`, `stock`, `original_stock`, `critical_stock`, `lot_number`, `expiration_date`, `shipment_date`, `created_at` | **One row per stock batch** — a SKU can span several rows |
| `Category` | `name` (unique) | |
| `Customer` | `name` (unique), `address`, `created_at`, `updated_at` | |
| `Sale` | `invoice_number`, `customer` (FK), `product` (FK), `quantity`, `total`, `date`, `status` (`Pending`/`Cancelled`/`Delivered`) | Stock is **not** deducted until `Delivered` |

### Stock model caveat

Because one SKU can appear in multiple `Product` rows (one per shipment/batch), the API treats stock as an **aggregate over `item_code`**: low-stock detection sums `stock` per `item_code` and compares it against the highest `critical_stock`; delivering a sale deducts from the aggregated view with `select_for_update()` inside an atomic transaction.

## Authentication & authorization

- **Public endpoints:** `POST /api/login/`, `POST /api/forgot-password/`, `POST /api/reset-password/<uidb64>/<token>/`, plus the SimpleJWT fallbacks `/api/token/` and `/api/token/refresh/`.
- **Everything else** requires a `Bearer` JWT access token (or DRF session auth), enforced by `DEFAULT_PERMISSION_CLASSES = (IsAuthenticated,)`.
- **Login** returns `access`, `refresh`, and a `user` object `{id, username, user_type_display}`. The frontend stores the tokens in `localStorage` and the axios interceptor adds the header.
- **Logout** blacklists the refresh token.
- **Role gates:** admin-only actions check `request.user.is_superuser or request.user.user_type == "ADMIN"` (user creation, user edits). Superusers cannot be deleted.

## API endpoint reference

All routes are prefixed `/api/`. `[PUBLIC]` needs no authentication.

### Auth

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/login/` `[PUBLIC]` | Log in → JWT access/refresh + user object |
| POST | `/token/` `[PUBLIC]` | SimpleJWT token pair endpoint |
| POST | `/token/refresh/` `[PUBLIC]` | Refresh the access token |
| POST | `/logout/` | Log out + blacklist refresh token |
| POST | `/forgot-password/` `[PUBLIC]` | Email a signed reset link (looks up user by email) |
| POST | `/reset-password/<uidb64>/<token>/` `[PUBLIC]` | Set a new password from a valid reset link |

### Users

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/users/` | List all users with role display |
| POST | `/register/` | Admin/superuser creates a user (ADMIN or USER) |
| PUT | `/users/<int:user_id>/edit/` | Edit a user (role-restricted) |
| DELETE | `/users/<int:user_id>/delete/` | Delete a non-superuser (admins only) |
| GET | `/users/total/` | Total user count |

### Products

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/products/` | List all products (formatted) |
| POST | `/products/add/` | Add a product (validates category by name) |
| GET | `/products/<int:product_id>/` | Single product details |
| PUT | `/products/<int:product_id>/edit/` | Edit product fields |
| DELETE | `/products/<int:product_id>/delete/` | Delete a product |
| PUT | `/products/<int:product_id>/update-stock/` | Add stock as a new batch row (+ `shipment_date`) |
| PUT | `/products/<int:product_id>/update-critical-stock/` | Set the low-stock threshold |
| GET | `/products/generate-csv/` | Product/shipment CSV export (`?item_code=` optional) |
| GET | `/products/total2/` | Total product count |
| GET | `/products/total/` | Total product count (dashboard variant) |
| GET | `/products/recent/` | 20 most recently created products |
| GET | `/products/low-stock/` | SKUs at/below their `critical_stock` (aggregated) |

### Categories & customers

| Method | Route | Purpose |
| --- | --- | --- |
| GET/POST | `/categories/` | List / create categories |
| PUT/DELETE | `/categories/<int:pk>/` | Update / delete a category |
| GET | `/categories/total/` | Total category count |
| GET/POST | `/customers/` | List / create customers |
| PUT/DELETE | `/customers/<int:pk>/` | Update / delete a customer |
| GET | `/customers/total/` | Total customer count |
| GET | `/sales/customers/` | `{id, name}` pairs for the Sales dropdown |

### Sales

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/sales/` | List all sales |
| POST | `/sales/add/` | Create a sale (no stock change until Delivered) |
| GET | `/sales/<int:id>/get` | Fetch one sale |
| PUT | `/sales/<int:sale_id>/edit/` | Edit a sale (blocked once Delivered) |
| PUT | `/sales/<int:sale_id>/update-status/` | Change status; Pending → Delivered deducts stock atomically |
| DELETE | `/sales/<int:id>/delete/` | Delete a sale |
| POST | `/sales/total/` | Daily sales count + revenue series for a `days` window |
| GET | `/sales/total/count/` | Total number of sales |
| GET | `/sales/latest/` | 20 most recent Delivered sales |
| GET | `/sales/products/` | Product options for the Sales dropdown (same view as `/products/`) |

### Reports & activity

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/sales-report/` | Filtered sales report — `format_type=csv` or `pdf`, filters `start_date`, `end_date`, `customer_name`, `item_code` (Delivered only) |
| GET | `/activity-logs/` | Latest 100 CRUD audit events (who/action/page/timestamp from django-easyaudit) |

**Defined but unused by the frontend:** `/token/`, `/token/refresh/`, `GET /products/<id>/`, `DELETE /users/<id>/delete/`, `GET /sales/<id>/get`, `GET /products/total/`. (`update_customer` exists in views but is not routed.)

## Key behaviors worth knowing

- **Delivered deducts stock only once** — `update_sale_status` runs in `transaction.atomic()`, locks the product with `select_for_update()`, and rejects the delivery if aggregate stock is insufficient (or the sale is already Delivered).
- **Password reset** — `forgot_password` looks up the user by **email**, signs a uid + token, and emails a link pointing at `FRONTEND_URL/reset-password/<uidb64>/<token>/`.
- **PDF reports** — `generate_pdf_report` searches several paths for `arial.ttf` and falls back to a built-in Helvetica font if it can't be found.
- **Audit trail** — django-easyaudit (`DJANGO_EASY_AUDIT_EVENTS`: model_delete, model_save, request) feeds the `/activity-logs/` endpoint.