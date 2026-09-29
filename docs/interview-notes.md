# SpendWise Interview Notes

## 1. Why FastAPI?

FastAPI provides clear Python route definitions, automatic validation, and interactive Swagger documentation. It is small enough for this project and easy to test.

## 2. Why React?

React makes the dashboard, forms, filters, charts, and loading states interactive without reloading the whole page.

## 3. Why SQLite?

SQLite is simple to run locally and is enough for a student portfolio application. A production deployment could move to PostgreSQL later.

## 4. Why SQLAlchemy?

SQLAlchemy maps Python classes to database tables and keeps database queries readable. It also supports relationships such as one user having many expenses.

## 5. What is JWT?

A JWT is a signed token created after login. The frontend sends it with protected requests, and FastAPI verifies it to identify the current user.

## 6. How does password hashing work?

The original password is transformed into a one-way hash before storage. During login, the submitted password is checked against the hash. The original password is never stored.

## 7. What is CORS?

CORS allows the local React development server and FastAPI server to communicate even though they use different local origins. SpendWise allows only its known development origins.

## 8. How does user data isolation work?

Authentication identifies the user, but every expense, income, budget, report, and CSV query also filters by `current_user.id`. Knowing another record's ID is not enough to access it.

## 9. How does pagination work?

The client sends a page and limit. FastAPI counts matching rows, then SQLAlchemy uses `offset()` and `limit()` so the server returns only that page.

## 10. Why filter in the backend?

Filtering hundreds of records in React wastes bandwidth and memory. Backend filtering lets SQLite return only the records needed for the current search and page.

## 11. How are reports calculated?

FastAPI filters the authenticated user's records by date, sums income and expenses, groups expenses by category, groups records by month, and returns numeric JSON values.

## 12. How does CSV export work?

FastAPI filters the user's transactions, writes headers and rows with Python's built-in `csv` module, and returns a `text/csv` response with a download filename.

## 13. Why use Recharts?

Recharts provides readable React chart components without requiring a custom chart implementation. It receives actual backend report data.

## 14. What happens when a JWT expires?

A `401` response triggers the shared session handler. The frontend removes the token, shows a session-expired message, and redirects to login.

## 15. What would change in production?

A production system would use a managed database, stronger secret management, HTTPS, refresh tokens, automated migrations, monitoring, and a deployment pipeline. Those are intentionally outside this local portfolio phase.
