from datetime import datetime, timezone

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .database import Base


def current_time():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=current_time, nullable=False)
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    payment_method = Column(String, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=current_time, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    user = relationship("User", back_populates="expenses")


class Income(Base):
    __tablename__ = "income"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=current_time, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    user = relationship("User", back_populates="incomes")


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (UniqueConstraint("user_id", "month", name="uq_budget_user_month"),)

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    month = Column(String, nullable=False)
    created_at = Column(DateTime, default=current_time, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    user = relationship("User", back_populates="budgets")