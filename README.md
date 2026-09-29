# SpendWise

SpendWise is a full-stack personal finance tracker that helps users manage expenses, income, monthly budgets, transaction history, and financial reports.

## Features

- JWT authentication and password hashing
- User profile and password management
- Expense and income CRUD
- Monthly budgets
- Dashboard analytics and Recharts visualizations
- Backend search, filters, sorting, and pagination
- Date-range reports
- Category and monthly analysis
- CSV export and browser print reports
- Light/dark theme preference
- Responsive React interface
- User data isolation
- Loading, empty, error, and toast feedback states

## Tech Stack

### Backend

- Python 3.12+
- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- pytest

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Recharts

## Project Structure

```text
SpendWise/
├── backend/
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── auth.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.py
│   │   ├── budgets.py
│   │   ├── dashboard.py
│   │   ├── expenses.py
│   │   ├── income.py
│   │   ├── reports.py
│   │   └── users.py
│   └── tests/
│       ├── conftest.py
│       ├── test_auth.py
│       ├── test_budget.py
│       ├── test_expenses.py
│       ├── test_income.py
│       ├── test_reports.py
│       └── test_security.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── .env.example
│   └── vite.config.js
├── docs/
│   ├── architecture.md
│   └── interview-notes.md
├── .gitignore
└── README.md
```

## Setup

Clone the repository using its actual repository URL:

```powershell
git clone <repository-url>
cd SpendWise
```

Create and activate the backend environment:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
```

Copy `backend/.env.example` to `backend/.env` and set local values:

```text
DATABASE_URL=sqlite:///./spendwise.db
SECRET_KEY=use-a-local-secret
ALGORITHM=HS256
```

Start FastAPI from the project root:

```powershell
uvicorn backend.main:app --reload
```

In a second PowerShell window, configure and start React:

```powershell
cd frontend
npm install
```

Copy `frontend/.env.example` to `frontend/.env` if needed:

```text
VITE_API_URL=http://127.0.0.1:8000
```

Start Vite:

```powershell
npm run dev
```

Open the application at `http://127.0.0.1:5173`.

## API Overview

Authentication:

```text
POST /auth/register
POST /auth/login
GET  /auth/me
```

Profile and settings:

```text
GET    /users/me
PUT    /users/me
PUT    /users/me/password
DELETE /users/me
```

Transactions and budgets:

```text
POST/GET/PUT/DELETE /expenses
POST/GET/PUT/DELETE /income
GET/POST/PUT         /budgets
```

Dashboard and reports:

```text
GET /dashboard/summary
GET /reports/summary
GET /reports/categories
GET /reports/monthly
GET /reports/budget
GET /reports/export/csv
```

Expense and income list endpoints support backend search, filtering, sorting, and pagination. Example:

```text
GET /expenses?category=Food&page=1&limit=10
```

## Screenshots

The following paths are reserved for real screenshots. They are not generated or faked by the application:

```text
screenshots/dashboard.png
screenshots/expenses.png
screenshots/reports.png
screenshots/settings.png
```

## Testing

Run the isolated backend test suite:

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests -q
```

The tests use an in-memory SQLite database and do not modify `spendwise.db`.

Build the frontend:

```powershell
cd frontend
npm run build
```

There is currently no `lint` script in `frontend/package.json`.

## Security Notes

- Passwords are hashed with bcrypt through Passlib.
- JWT settings come from `backend/.env`.
- `.env`, databases, virtual environments, `node_modules`, build output, and pytest caches are ignored.
- Protected database queries filter by the authenticated user's ID.
- Account deletion requires password confirmation.

## Future Improvements

- PostgreSQL for production deployments
- Refresh tokens
- Automated recurring transactions
- Database migrations
- Deployment automation
