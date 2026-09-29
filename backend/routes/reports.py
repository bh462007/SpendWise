import csv
import io
from calendar import month_name
from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Budget, Expense, Income, User


router = APIRouter(prefix="/reports", tags=["Reports"])


def get_date_range(start_date, end_date):
    today = date_type.today()
    if start_date is None:
        start_date = today.replace(day=1)
    if end_date is None:
        end_date = today
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date",
        )
    return start_date, end_date


def get_user_transactions(start_date, end_date, current_user, db):
    expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id,
            Expense.date >= start_date,
            Expense.date <= end_date,
        )
        .all()
    )
    incomes = (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id,
            Income.date >= start_date,
            Income.date <= end_date,
        )
        .all()
    )
    return expenses, incomes


def next_month(value):
    if value.month == 12:
        return value.replace(year=value.year + 1, month=1)
    return value.replace(month=value.month + 1)


@router.get("/summary")
def report_summary(
    start_date: date_type | None = None,
    end_date: date_type | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_date, end_date = get_date_range(start_date, end_date)
    expenses, incomes = get_user_transactions(start_date, end_date, current_user, db)
    category_totals = {}
    for expense in expenses:
        category_totals[expense.category] = category_totals.get(expense.category, 0) + expense.amount
    sorted_categories = sorted(category_totals.items(), key=lambda item: item[1], reverse=True)

    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_income": sum(income.amount for income in incomes),
        "total_expenses": sum(expense.amount for expense in expenses),
        "balance": sum(income.amount for income in incomes) - sum(expense.amount for expense in expenses),
        "transaction_count": len(expenses) + len(incomes),
        "top_category": {"category": sorted_categories[0][0], "amount": sorted_categories[0][1]} if sorted_categories else None,
    }


@router.get("/categories")
def category_report(
    start_date: date_type | None = None,
    end_date: date_type | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_date, end_date = get_date_range(start_date, end_date)
    expenses, _ = get_user_transactions(start_date, end_date, current_user, db)
    totals = {}
    for expense in expenses:
        totals[expense.category] = totals.get(expense.category, 0) + expense.amount
    categories = [{"category": category, "amount": amount} for category, amount in sorted(totals.items(), key=lambda item: item[1], reverse=True)]
    return {"categories": categories}


@router.get("/monthly")
def monthly_report(
    start_date: date_type | None = None,
    end_date: date_type | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_date, end_date = get_date_range(start_date, end_date)
    expenses, incomes = get_user_transactions(start_date, end_date, current_user, db)
    months = []
    current_month = start_date.replace(day=1)
    final_month = end_date.replace(day=1)

    while current_month <= final_month:
        month_key = f"{current_month.year:04d}-{current_month.month:02d}"
        month_expenses = sum(expense.amount for expense in expenses if expense.date.year == current_month.year and expense.date.month == current_month.month)
        month_income = sum(income.amount for income in incomes if income.date.year == current_month.year and income.date.month == current_month.month)
        months.append({"month": month_key, "income": month_income, "expenses": month_expenses})
        current_month = next_month(current_month)

    return {"months": months}


@router.get("/budget")
def budget_report(
    month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        year, month_number = [int(value) for value in month.split("-")]
        month_start = date_type(year, month_number, 1)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Month must use YYYY-MM format")

    if month_number == 12:
        month_end = date_type(year + 1, 1, 1)
    else:
        month_end = date_type(year, month_number + 1, 1)
    budget = db.query(Budget).filter(Budget.user_id == current_user.id, Budget.month == month).first()
    spent = db.query(Expense).filter(Expense.user_id == current_user.id, Expense.date >= month_start, Expense.date < month_end).with_entities(Expense.amount).all()
    total_spent = sum(row[0] for row in spent)
    budget_amount = budget.amount if budget else 0
    remaining = budget_amount - total_spent
    percentage_used = round(total_spent / budget_amount * 100, 2) if budget_amount > 0 else 0
    return {"budget": budget_amount, "spent": total_spent, "remaining": remaining, "percentage_used": percentage_used}


@router.get("/export/csv")
def export_csv(
    start_date: date_type | None = None,
    end_date: date_type | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    start_date, end_date = get_date_range(start_date, end_date)
    expenses, incomes = get_user_transactions(start_date, end_date, current_user, db)
    rows = []

    for expense in expenses:
        rows.append(["Expense", expense.title, expense.amount, expense.category, expense.payment_method, expense.date, expense.note or ""])
    for income in incomes:
        rows.append(["Income", income.source, income.amount, "Income", "", income.date, income.note or ""])
    rows.sort(key=lambda row: row[5])

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Type", "Title/Source", "Amount", "Category", "Payment Method", "Date", "Note"])
    writer.writerows(rows)
    filename = f"spendwise_report_{start_date}_{end_date}.csv"
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )