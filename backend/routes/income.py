from datetime import date as date_type
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Income, User
from ..schemas import IncomeCreate, IncomeListResponse, IncomeResponse, IncomeUpdate


router = APIRouter(prefix="/income", tags=["Income"])


def find_user_income(income_id, user_id, db):
    income = (
        db.query(Income)
        .filter(Income.id == income_id, Income.user_id == user_id)
        .first()
    )
    if income is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found",
        )
    return income


@router.post("", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    income_data: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    income = Income(**income_data.model_dump(), user_id=current_user.id)
    db.add(income)
    db.commit()
    db.refresh(income)
    return income


@router.get("", response_model=IncomeListResponse)
def get_income(
    search: str | None = None,
    start_date: date_type | None = None,
    end_date: date_type | None = None,
    sort_by: Literal["date", "amount", "source"] = "date",
    sort_order: Literal["asc", "desc"] = "desc",
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Income).filter(Income.user_id == current_user.id)

    if search:
        search_text = f"%{search.strip()}%"
        query = query.filter(or_(Income.source.ilike(search_text), Income.note.ilike(search_text)))
    if start_date:
        query = query.filter(Income.date >= start_date)
    if end_date:
        query = query.filter(Income.date <= end_date)

    sort_columns = {
        "date": Income.date,
        "amount": Income.amount,
        "source": Income.source,
    }
    sort_column = sort_columns[sort_by]
    if sort_order == "asc":
        query = query.order_by(sort_column.asc(), Income.id.asc())
    else:
        query = query.order_by(sort_column.desc(), Income.id.desc())

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


@router.get("/{income_id}", response_model=IncomeResponse)
def get_one_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return find_user_income(income_id, current_user.id, db)


@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    income_data: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    income = find_user_income(income_id, current_user.id, db)

    for field, value in income_data.model_dump(exclude_unset=True).items():
        setattr(income, field, value)

    db.commit()
    db.refresh(income)
    return income


@router.delete("/{income_id}")
def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    income = find_user_income(income_id, current_user.id, db)
    db.delete(income)
    db.commit()
    return {"message": "Income deleted successfully"}