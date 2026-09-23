# MediMarc Frontend

React 18 + Vite 6 single-page application with **Tailwind CSS v4** and **shadcn/ui** components. Talks to the Django REST API via a shared axios instance.

## Scripts

```bash
npm run dev       # start the Vite dev server (http://localhost:5173)
npm run build     # production build into dist/
npm run lint      # ESLint (expected: 0 errors)
npm run preview   # preview the production build
```

## Project structure

```
frontend/
├── index.html             # entry HTML (<div id="root">), title "Medimarc Inventory"
├── vite.config.js         # @ -> ./src alias, @tailwindcss/vite + react plugins
├── components.json        # shadcn/ui config (New York style, lucide icons)
├── package.json           # dependencies & scripts
├── src/
│   ├── main.jsx           # createRoot + StrictMode + index.css
│   ├── App.jsx            # route definitions + <Toaster> (sonner)
│   ├── index.css          # Tailwind v4 + design tokens (primary #4f46e5, light theme)
│   ├── lib/
│   │   ├── api.js         # axios instance + auth/error interceptors
│   │   └── utils.js       # cn() — clsx + tailwind-merge
│   ├── components/
│   │   ├── layout/        # AppLayout, Sidebar, AuthLayout, PageHeader
│   │   ├── common/        # Combobox, StatCard, EmptyState, StatusBadge
│   │   └── ui/            # shadcn/ui primitives (button, card, dialog, select, …)
│   └── pages/
│       ├── auth/          # LoginPage, ForgotPassword, ResetPassword
│       ├── dashboard/     # HomePage
│       ├── inventory/     # ProductManagement, Categories, CustomerManagement, Sales, SalesReport
│       └── admin/         # UserManagement, ActivityLog
```

The `@` alias maps to `src/` (defined in `vite.config.js` and `jsconfig.json`).

## Routes

| Path | Page | Description |
| --- | --- | --- |
| `/` | `pages/auth/LoginPage` | Login form → stores JWT + user, redirects to `/home` |
| `/forgot-password` | `pages/auth/ForgotPassword` | Requests a password-reset email |
| `/reset-password/:uidb64/:token` | `pages/auth/ResetPassword` | Sets a new password from the emailed link |
| `/home` | `pages/dashboard/HomePage` | Dashboard: stat cards, sales chart, low-stock/sales lists |
| `/products` | `pages/inventory/ProductManagement` | Product CRUD, stock updates by batch, critical thresholds |
| `/categories` | `pages/inventory/Categories` | Category CRUD |
| `/customers` | `pages/inventory/CustomerManagement` | Customer CRUD |
| `/sales` | `pages/inventory/Sales` | Create/edit sales, update status (Pending/Cancelled/Delivered) |
| `/reports` | `pages/inventory/SalesReport` | Filtered CSV/PDF sales reports |
| `/user-management` | `pages/admin/UserManagement` | List/create/edit users with roles |
| `/activity-logs` | `pages/admin/ActivityLog` | Who did what, when |

Routes after login are wrapped in `AppLayout` (sidebar navigation + page container). Auth pages use `AuthLayout`. Toasts are handled by **sonner** (`<Toaster position="top-center" richColors />`).

## API layer (`src/lib/api.js`)

- Base URL: `VITE_API_URL || "http://localhost:8000/api/"`.
- **Request interceptor** adds `Authorization: Bearer <access_token>` from `localStorage`; for `/send-email` requests it also adds the `x-resend-api-key` header.
- **Response interceptor** on HTTP 401 clears the stored tokens/user and redirects to `/` (login).

## Pages → backend endpoints

| Page | Endpoints |
| --- | --- |
| LoginPage | `POST /login/` |
| ForgotPassword | `POST /forgot-password/` |
| ResetPassword | `POST /reset-password/<uidb64>/<token>/` |
| HomePage | `POST /sales/total/`, `GET /sales/total/count/`, `GET /sales/latest/`, `GET /products/low-stock/`, `GET /products/recent/`, `GET /users/total/`, `GET /customers/total/`, `GET /categories/total/` |
| ProductManagement | `GET/POST /products/`, `GET /products/total2/`, `PUT /products/<id>/edit/`, `DELETE /products/<id>/delete/`, `PUT /products/<id>/update-stock/`, `PUT /products/<id>/update-critical-stock/`, `GET /products/generate-csv/`, `GET /categories/` |
| Categories | `GET /categories/`, `POST /categories/`, `PUT|DELETE /categories/<pk>/` |
| CustomerManagement | `GET /customers/`, `POST /customers/`, `PUT|DELETE /customers/<pk>/` |
| Sales | `GET /sales/`, `POST /sales/add/`, `PUT /sales/<id>/edit/`, `PUT /sales/<id>/update-status/`, `DELETE /sales/<id>/delete/`, `GET /sales/customers/`, `GET /sales/products/` |
| SalesReport | `GET /sales-report/?start_date=&end_date=&customer_name=&item_code=&format_type=`, `GET /customers/`, `GET /sales/` |
| UserManagement | `GET /users/`, `POST /register/`, `PUT /users/<id>/edit/` |
| ActivityLog | `GET /activity-logs/` |

## Shared components

- **`components/layout/`** — `AppLayout` (logged-in shell: sidebar + outlet), `Sidebar` (navigation, active states), `AuthLayout` (gradient backdrop for auth pages), `PageHeader` (page titles; **named export**).
- **`components/common/`** — `Combobox` (searchable select: `{ options, value, onChange, placeholder, emptyText, searchPlaceholder, className, disabled }`, onChange returns the **string value**), `StatCard` (dashboard metrics), `EmptyState` (empty-table placeholder), `StatusBadge` (`SaleStatusBadge`: Pending/Cancelled/Delivered).
- **`components/ui/`** — standard shadcn/ui primitives (button, card, dialog, alert-dialog, select, badge, input, label, skeleton, table, tabs, command, popover, separator, sheet, tooltip, dropdown-menu).

## Styling

- Tailwind CSS v4 via the `@tailwindcss/vite` plugin (no `tailwind.config.js`; theme tokens live in `src/index.css`).
- Design tokens: primary `#4f46e5`, accent-foreground `#4338ca`, background `#f8fafc`, destructive `#dc2626`, success `#059669`, warning `#d97706`, radius `0.625rem`.
- Light-only theme; all icons from **lucide-react**.

## Environment variables (`frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Axios base URL for the Django API (default `http://localhost:8000/api/`) |
| `VITE_RESEND_API_KEY` | Resend key attached as `x-resend-api-key` (used by the `/send-email` interceptor path) |

## Dependencies (highlights)

- **Runtime:** react, react-dom, react-router-dom, axios, recharts (dashboard charts), date-fns (date formatting), sonner (toasts), lucide-react (icons), cmdk (Combobox search), @radix-ui/react-* primitives, class-variance-authority / clsx / tailwind-merge / tw-animate-css (shadcn foundation).
- **Dev:** vite, @tailwindcss/vite, tailwindcss, eslint + react plugins, node/buffer polyfills (kept for client-side PDF/streaming paths).