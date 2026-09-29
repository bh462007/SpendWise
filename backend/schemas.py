from __future__ import annotations

import re
from datetime import date as date_type, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

    @field_validator("name")
    @classmethod
    def validate_name(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Name is required")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value):
        if len(value) < 6:
            raise ValueError("Password must be at least 6 characters")
        return value


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        return value.strip().lower()


class UserResponse(BaseModel):
    id: int
    name: str
    email: str


class UserProfileResponse(UserResponse):
    created_at: datetime


class ProfileUpdate(BaseModel):
    name: str
    email: str

    @field_validator("name")
    @classmethod
    def validate_profile_name(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Name is required")
        return value

    @field_validator("email")
    @classmethod
    def validate_profile_email(cls, value):
        value = value.strip().lower()
        if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", value):
            raise ValueError("Enter a valid email address")
        return value


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value):
        if len(value) < 8:
            raise ValueError("Password must contain at least 8 characters")
        return value


class DeleteAccountRequest(BaseModel):
    password: str


ExpenseCategory = Literal[
    "Food",
    "Travel",
    "Shopping",
    "Bills",
    "Education",
    "Health",
    "Entertainment",
    "Other",
]

PaymentMethod = Literal[
    "Cash",
    "UPI",
    "Debit Card",
    "Credit Card",
    "Bank Transfer",
    "Other",
]


class ExpenseCreate(BaseModel):
    title: str
    amount: float = Field(gt=0)
    category: ExpenseCategory
    date: date_type
    payment_method: PaymentMethod
    note: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Title is required")
        return value


class ExpenseUpdate(BaseModel):
    title: str | None = None
    amount: float | None = Field(default=None, gt=0)
    category: ExpenseCategory | None = None
    date: date_type | None = None
    payment_method: PaymentMethod | None = None
    note: str | None = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, value):
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Title is required")
        return value


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    amount: float
    category: ExpenseCategory
    date: date_type
    payment_method: PaymentMethod
    note: str | None
    created_at: datetime


class IncomeCreate(BaseModel):
    source: str
    amount: float = Field(gt=0)
    date: date_type
    note: str | None = None

    @field_validator("source")
    @classmethod
    def validate_source(cls, value):
        value = value.strip()
        if not value:
            raise ValueError("Source is required")
        return value


class IncomeUpdate(BaseModel):
    source: str | None = None
    amount: float | None = Field(default=None, gt=0)
    date: date_type | None = None
    note: str | None = None

    @field_validator("source")
    @classmethod
    def validate_source(cls, value):
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Source is required")
        return value


class IncomeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    amount: float
    date: date_type
    note: str | None
    created_at: datetime


class BudgetCreate(BaseModel):
    amount: float = Field(gt=0)
    month: str

    @field_validator("month")
    @classmethod
    def validate_month(cls, value):
        try:
            datetime.strptime(value, "%Y-%m")
        except ValueError:
            raise ValueError("Month must use YYYY-MM format")
        return value


class BudgetUpdate(BaseModel):
    amount: float | None = Field(default=None, gt=0)
    month: str | None = None

    @field_validator("month")
    @classmethod
    def validate_month(cls, value):
        if value is None:
            return value
        try:
            datetime.strptime(value, "%Y-%m")
        except ValueError:
            raise ValueError("Month must use YYYY-MM format")
        return value


class BudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: float
    month: str
    created_at: datetime


class ExpenseListResponse(BaseModel):
    items: list[ExpenseResponse]
    page: int
    limit: int
    total_items: int
    total_pages: int


class IncomeListResponse(BaseModel):
    items: list[IncomeResponse]
    page: int
    limit: int
    total_items: int
    total_pages: int