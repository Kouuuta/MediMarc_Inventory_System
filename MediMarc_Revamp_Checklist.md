# MediMarc Inventory System — Revamp Checklist

Findings from a full read-through of `Kouuuta/MediMarc_Inventory_System` (Django REST backend + React/Vite frontend).

> **Status legend:** `[x]` done — `[x] (note)` done with caveats — `[ ] ⏸️` deferred (out of approved scope: "critical + bugs + API layer").

---

## 🚨 Critical — fix before anything else (repo is now public)

- [x] **Rotate the Gmail app password** hardcoded in `backend/backend/settings.py` (`EMAIL_HOST_PASSWORD`) — moved to `backend/.env` (gitignored) via `python-decouple`. ⚠️ **Still required:** since git history was **not** rewritten, the original value remains in old commits — you must still change the real Gmail app password (settings came from an already-public repo).
- [x] **Rotate the Resend API key** hardcoded in `settings.py` (`RESEND_API_KEY`) — moved to `backend/.env` (gitignored). ⚠️ Same caveat: history was not rewritten; rotate the real key (it already leaked publicly).
- [x] **Rotate/regenerate the Django `SECRET_KEY`** hardcoded in `settings.py` — a fresh key was generated and is now loaded from `backend/.env`. Secret signing material no longer lives in a committed file.
- [x] (partial) **Remove `db.sqlite3` (5MB) from the repo** — removed from the index (`git rm --cached`) and added to `.gitignore`. ⏸️ Scrubbing it **from git history** (`git filter-repo` / reinit) was explicitly deferred — old commits still contain it.
- [x] (partial) **Remove the committed `backend/venv/` folder (77MB)** — removed from the index (`git rm -r --cached`) and the `.gitignore` rule fixed (`/venv` → `venv/`). ⏸️ History scrub deferred (same as above).
- [x] **Move all secrets to environment variables** — `python-decouple` is now wired in `settings.py` (`config()`/`Csv`); secrets load from `backend/.env` (gitignored); `backend/.env.example` committed as a secret-free template.
- [x] **Turn off `DEBUG = True` and `CORS_ALLOW_ALL_ORIGINS = True`** — both are now env-driven flags (`DEBUG` defaults False; CORS restricted to `CORS_ALLOWED_ORIGINS` from env, defaulting to `http://localhost:5173`).

---

## 🐞 Real bugs

- [x] **Unsafe `localStorage` parsing crashes the page.** In `ProductManagement.jsx`, `Categories.jsx`, `CustomerManagement.jsx`, `Sales.jsx`, and `UserManagement.jsx` the `JSON.parse(localStorage.getItem("user"))` result is now null-guarded (`loggedInUser?.user_type_display`) so a fresh/cleared browser redirects to login instead of crashing. (`ResetPassword.jsx` reads no user object; `ActivityLog.jsx` self-contained.)
- [x] **Possible race condition on stock deduction.** `update_sale_status` now wraps the delivery in `transaction.atomic()`, locks the product row with `Product.objects.select_for_update()`, and **validates stock before** saving the new "Delivered" status — an undersupplied delivery can no longer mark the sale delivered, and concurrent deliveries can't oversell.
- [x] **`SalesFilter` is dead code.** `filters.py` deleted; both duplicate imports removed from `views.py`.
- [x] **Inconsistent URL param typing.** `products/<str:product_id>/delete/`, `.../edit/`, and `.../update-stock/` now use `<int:product_id>` (matches the `AutoField` PK; garbage input rejected early).
- [x] **`generate_pdf_report` loads `arial.ttf` by a bare relative path** — now searches several candidate paths (`settings.BASE_DIR`, view package dir, CWD), falls back to a built-in Helvetica font, and no longer crashes when the font file is absent.
- [x] **Debug `print()` statements left in production code paths** — `add_sale`, `update_stock`, and `forgot_password` now use `logging` (`logger = logging.getLogger(__name__)`); the password-reset link is no longer printed to the console; the two `print()`s in the dead `SaleViewSet.create` (both copies) died with the class.

---

## 🏗️ Data model / architecture

- [x] (partial) **`sales_stock` dead reference** — removed the `data["sales_stock"] = ...` line in `add_product` (was not a model field). ⏸️ The full **Product vs. StockBatch/Lot split** stays deferred; the aggregate `GROUP BY item_code` approach still stands for now.
- [ ] ⏸️ **Stock is split across duplicate `Product` rows** — deferred (product/StockBatch model rework).
- [ ] ⏸️ **No pagination** on `get_products`, `get_sales`, `get_users`, etc. — deferred.
- [ ] ⏸️ **Permission logic duplicated inline** — deferred (kept in the function views as-is).
- [ ] ⏸️ **Mostly function-based views instead of ViewSets + routers** — deferred. (The one real ViewSet, `SaleViewSet`, was **dead code** — never routed — and was removed, not kept.)

---

## 🧹 Code quality / consistency

- [x] **Zero test coverage** — added `backend/api/tests.py` with 5 passing tests (APITestCase, authenticated via `force_authenticate`): delivering deducts stock, insufficient stock keeps the sale pending, delivered sales can't be changed, invalid status rejected, low-stock aggregation across duplicate `item_code` rows. Run with `manage.py test api`.
- [x] **Frontend bypasses its own API layer** — all 11 pages migrated to `import api from "../services/api"` (base URL + Bearer header injection centralized; hardcoded `http://localhost:8000/api/...` gone). `baseURL` is env-driven: `VITE_API_URL || "http://localhost:8000/api/"`; root `frontend/.env` now defines `VITE_API_URL` (replacing the unused `REACT_APP_API_URL`).
- [ ] ⏸️ **Oversized components** — deferred (splitting `ProductManagement.jsx`/`Sales.jsx`).
- [x] **Redundant route registrations** — `products/` and `sales/products/` both point at `get_products`. This is **intentional**: `Sales.jsx` consumes `sales/products/` for its product dropdown. Kept both; the duplicate `reverse` name was renamed to `sales_product_options` to remove the collision.

---

## 🔐 Security hardening (beyond the leaked secrets)

- [ ] ⏸️ **No rate limiting / throttling** on `login/`, `forgot-password/`, `reset-password/` — deferred.
- [ ] ⏸️ **JWT stored in `localStorage`** — deferred (httpOnly-cookie flow). Note: the 401 interceptor in `services/api.js` clears storage and redirects to login.

---

## ✅ Additional fixes applied (not on the original list)

- **`forgot_password` crashed on unknown email** — caught `User.DoesNotExist` (a class that no longer exists in this codebase) → now `CustomUser.DoesNotExist`; request now returns 404 cleanly.
- **Dead `login_user` function removed** — unused JWT duplicate of `LoginView`; removed with its `authenticate`/`User` imports.
- **Dead `SaleViewSet` removed from `views.py` *and* `serializers.py`** (duplicate definitions, never routed, used broken `from requests import Response`, missing `status` import). `LoginEventSerializer` (never imported anywhere) also removed.
- **Broken/unused imports removed** from `views.py` and `serializers.py` (`json`, `datetime`, `make_password`, `Paginator`, `JWTAuthentication`, `DjangoFilterBackend`, `canvas`, `viewsets`, `timezone`, `datetime`, `ContentType`, `CRUDEvent` from serializers, duplicate `SalesFilter`/`APIView`). `CRUDEvent` kept in views — still used by `ActivityLogView`.
- **`get_low_stock_products` fixed** — previous query filtered `total_stock <= critical_stock` but never fetched `critical_stock` into the aggregate (comparison happened between a SUM and an unselected column). Now annotated `critical_stock=Max("critical_stock")`; stale docstring referencing "<= 500" replaced.
- **Login response now includes the user `id`** — `LoginSerializer` adds `"id"` to the `user` payload so the frontend can derive `loggedInUserId` from the stored user object (`localStorage.getItem("userId")` was never set by any login flow).
- **`Sales.jsx` dead daily/monthly summary block removed** — the `sales/daily/` and `sales/monthly/` endpoints don't exist on the backend (no URLs, no views); the `Promise.all` hit 404s every render. Entire effect, its states, and the no-op `filterDailySales`/`filterMonthlySales` helpers removed.
- **`Sales.jsx` status-change NaN bug fixed** — the "Delivered" branch ran `prevProducts.map((p) => p.product_id === p.product_id ? { ...p, stock: p.stock - undefined } : p)…`; the condition `p.product_id === p.product_id` is always true and `response.data.product`/`.quantity` don't exist (the view returns only `{message, status}`), so every product's stock became `NaN`. Removed — the backend already deducts stock on delivery; the client now only updates the sale's status in state.
- **Unused local state/functions removed** in pages touched this round (`filteredProducts`/`selectedItemCode` + the pointless `fetchLowStockProducts` in `ProductManagement.jsx`, `setPage`/`handleLogout`/`loggedInUserId` in `Sales.jsx`, `handleLogout` in `CustomerManagement.jsx`, dead `forge`/`resetToken` in `ForgotPassword.jsx`, unused setter state in `ResetPassword.jsx`/`LoginPage.jsx`/`UserManagement.jsx`).
- **Frontend lint cleanup** — removed unused `React` default imports (React 18 JSX transform) across pages/components; `index.jsx` migrated from deprecated `ReactDOM.render` to `createRoot`. `eslint .` is now **0 errors** (8 pre-existing exhaustive-deps *warnings* remain, intentionally untouched — adding `navigate` to deps would change run-once redirect semantics). `npm run build` passes.
- **`manage.py check`** passes with 0 issues; **5/5 backend tests pass**.

---

## Suggested priority order for the revamp

1. **Secrets & git history cleanup** (Critical section) — secrets are out of committed files, but history scrub is still pending; rotate the Gmail app password + Resend key on the provider side.
2. **Data model rework** (Product vs. StockBatch split) — everything else about stock/inventory logic builds on this, so it's cheapest to fix early.
3. **Consolidate API layer** — ViewSets + real permission classes on the backend (frontend `api.js` usage already consolidated).
4. **Add tests** around stock deduction, low-stock alerting, and role permissions before/while refactoring, so regressions are caught immediately.
5. **Polish**: pagination, component splitting, throttling, JWT storage — valuable but lower urgency than the above.