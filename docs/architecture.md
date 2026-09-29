# SpendWise Architecture

SpendWise is a small full-stack personal finance application.

```text
React + Vite frontend
        |
        | fetch + JWT Authorization header
        v
FastAPI REST API
        |
        v
SQLAlchemy models and queries
        |
        v
SQLite database
```

## Authentication Flow

1. A user registers with a password.
2. FastAPI hashes the password before saving it.
3. The user logs in with email and password.
4. FastAPI verifies the password and creates a JWT.
5. React stores the JWT token in localStorage.
6. Protected requests send `Authorization: Bearer <token>`.
7. FastAPI verifies the JWT and identifies the current user.
8. Database queries filter by that user's ID.

Passwords and password hashes are never returned to React.

## Expense and Income Flow

```text
React form
   ↓
fetch POST/PUT request
   ↓
FastAPI validation and JWT dependency
   ↓
SQLAlchemy creates or updates a user-owned record
   ↓
SQLite
```

Expense and income list endpoints perform search, filters, sorting, and pagination in the backend. React receives only the requested page.

## Budget Flow

A budget belongs to one user and one `YYYY-MM` month. A database uniqueness rule prevents duplicate budgets for the same user and month.

## Report Flow

```text
React requests a date range
   ↓
FastAPI validates dates and current user
   ↓
SQLAlchemy queries that user's transactions
   ↓
Backend calculates totals and groups
   ↓
JSON returns to React
   ↓
Cards and Recharts display the result
```

CSV export uses the same user and date filters, then Python's built-in `csv` module creates the download response.

## Settings and Security

The Settings API supports profile updates, password changes, and password-confirmed account deletion. Existing SQLAlchemy relationships cascade deletion to that user's expenses, income, and budgets. The frontend removes the JWT after deletion or when an authenticated request returns `401`.
