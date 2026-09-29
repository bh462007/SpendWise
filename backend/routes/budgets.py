from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Budget, User
from ..schemas import BudgetCreate, BudgetResponse, BudgetUpdate


router = APIRouter(prefix="/budgets", tags=["Budgets"])


def duplicate_budget_error():
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="A budget already exists for this month",
    )


def find_user_budget(budget_id, user_id, db):
    budget = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()
    if budget is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    return budget


@router.get("", response_model=list[BudgetResponse])
def get_budgets(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Budget).filter(Budget.user_id == current_user.id).order_by(Budget.month.desc()).all()


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_budget = db.query(Budget).filter(Budget.user_id == current_user.id, Budget.month == budget_data.month).first()
    if existing_budget:
        raise duplicate_budget_error()

    budget = Budget(**budget_data.model_dump(), user_id=current_user.id)
    db.add(budget)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise duplicate_budget_error()
    db.refresh(budget)
    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = find_user_budget(budget_id, current_user.id, db)
    for field, value in budget_data.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise duplicate_budget_error()
    db.refresh(budget)
    return budget