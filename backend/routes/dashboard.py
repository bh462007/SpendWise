from calendar import month_name
from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Budget, Expense, Income, User


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def month_value(year, month, offset=0):
    total_months = year * 12 + month - 1 + offset
    return total_months // 12, total_months % 12 + 1


def month_key(year, month):
    return f"{year:04d}-{month:02d}"


@router.get("/summary")
def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    current_month = month_key(today.year, today.month)
    expenses = db.query(Expense).filter(Expense.user_id == current_user.id).all()
    incomes = db.query(Income).filter(Income.user_id == current_user.id).all()
    current_expenses = [expense for expense in expenses if expense.date.year == today.year and expense.date.month == today.month]
    current_income = [record for record in incomes if record.date.year == today.year and record.date.month == today.month]

    total_income = sum(record.amount for record in current_income)
    total_expenses = sum(expense.amount for expense in current_expenses)
    budget = db.query(Budget).filter(Budget.user_id == current_user.id, Budget.month == current_month).first()
    monthly_budget = budget.amount if budget else 0
    budget_remaining = monthly_budget - total_expenses
    budget_percentage = (total_expenses / monthly_budget * 100) if monthly_budget > 0 else 0

    category_totals = {}
    for expense in current_expenses:
        category_totals[expense.category] = category_totals.get(expense.category, 0) + expense.amount
    category_expenses = [
        {"category": category, "amount": amount}
        for category, amount in sorted(category_totals.items(), key=lambda item: item[1], reverse=True)
    ]

    monthly_expenses = []
    for offset in range(-5, 1):
        year, month = month_value(today.year, today.month, offset)
        total = sum(expense.amount for expense in expenses if expense.date.year == year and expense.date.month == month)
        monthly_expenses.append({
            "month": month_key(year, month),
            "label": f"{month_name[month][:3]} {year}",
            "amount": total,
        })

    transactions = []
    for expense in expenses:
        transactions.append({
            "type": "Expense",
            "title": expense.title,
            "date": expense.date,
            "amount": expense.amount,
        })
    for record in incomes:
        transactions.append({
            "type": "Income",
            "title": record.source,
            "date": record.date,
            "amount": record.amount,
        })
    transactions.sort(key=lambda transaction: transaction["date"], reverse=True)

    return {
        "current_month": current_month,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "balance": total_income - total_expenses,
        "monthly_budget": monthly_budget,
        "budget_used": total_expenses,
        "budget_remaining": budget_remaining,
        "budget_percentage": round(budget_percentage, 2),
        "highest_spending_category": category_expenses[0]["category"] if category_expenses else None,
        "category_expenses": category_expenses,
        "monthly_expenses": monthly_expenses,
        "recent_transactions": transactions[:10],
    }