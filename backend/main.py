from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import Base, engine
from .routes.auth import router as auth_router
from .routes.expenses import router as expenses_router
from .routes.income import router as income_router
from .routes.budgets import router as budgets_router
from .routes.dashboard import router as dashboard_router
from .routes.reports import router as reports_router
from .routes.users import router as users_router


@asynccontextmanager
async def lifespan(app):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="SpendWise API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(expenses_router)
app.include_router(income_router)
app.include_router(budgets_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(users_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to SpendWise API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}