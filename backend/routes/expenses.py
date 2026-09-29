from datetime import date as date_type
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Expense, User
from ..schemas import ExpenseCategory, ExpenseCreate, ExpenseListResponse, ExpenseResponse, ExpenseUpdate, PaymentMethod


router = APIRouter(prefix="/expenses", tags=["Expenses"])


def find_user_expense(expense_id, user_id, db):
    expense = (
        db.query(Expense)
        .filter(Expense.id == expense_id, Expense.user_id == user_id)
        .first()
    )
    if expense is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )
    return expense


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = Expense(**expense_data.model_dump(), user_id=current_user.id)
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("", response_model=ExpenseListResponse)
def get_expenses(
    search: str | None = None,
    category: ExpenseCategory | None = None,
    payment_method: PaymentMethod | None = None,
    start_date: date_type | None = None,
    end_date: date_type | None = None,
    sort_by: Literal["date", "amount", "title"] = "date",
    sort_order: Literal["asc", "desc"] = "desc",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    if search:
        search_text = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Expense.title.ilike(search_text),
                Expense.category.ilike(search_text),
                Expense.note.ilike(search_text),
            )
        )
    if category:
        query = query.filter(Expense.category == category)
    if payment_method:
        query = query.filter(Expense.payment_method == payment_method)
    if start_date:
        query = query.filter(Expense.date >= start_date)
    if end_date:
        query = query.filter(Expense.date <= end_date)

    sort_columns = {
        "date": Expense.date,
        "amount": Expense.amount,
        "title": Expense.title,
    }
    sort_column = sort_columns[sort_by]
    if sort_order == "asc":
        query = query.order_by(sort_column.asc(), Expense.id.asc())
    else:
        query = query.order_by(sort_column.desc(), Expense.id.desc())

    total_items = query.order_by(None).count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    total_pages = (total_items + limit - 1) // limit if total_items else 0

    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total_items": total_items,
        "total_pages": total_pages,
    }


@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return find_user_expense(expense_id, current_user.id, db)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_data: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = find_user_expense(expense_id, current_user.id, db)

    for field, value in expense_data.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = find_user_expense(expense_id, current_user.id, db)
    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully"}