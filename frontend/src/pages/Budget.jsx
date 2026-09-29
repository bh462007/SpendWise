import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createBudget, getBudgets, getExpenses, updateBudget } from "../services/api";
import { useToast } from "../components/ToastContext";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
}

function monthLabel(value) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T00:00:00Z`));
}

export default function Budget() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadBudgetData();
  }, []);

  async function loadBudgetData() {
    setIsLoading(true);
    try {
      const [budgetData, expenseData] = await Promise.all([getBudgets(), getExpenses({ limit: 50 })]);
      setBudgets(budgetData);
      setExpenses(expenseData.items);
    } catch (requestError) {
      if (requestError.message.includes("credentials")) {
        localStorage.removeItem("spendwise_token");
        navigate("/login", { replace: true });
        return;
      }
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  const selectedBudget = budgets.find((budget) => budget.month === selectedMonth);
  const spent = useMemo(() => expenses.filter((expense) => expense.date.startsWith(selectedMonth)).reduce((total, expense) => total + expense.amount, 0), [expenses, selectedMonth]);
  const budgetAmount = selectedBudget?.amount || 0;
  const remaining = budgetAmount - spent;
  const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
  const progressWidth = Math.min(percentage, 100);

  useEffect(() => {
    setAmount(selectedBudget ? String(selectedBudget.amount) : "");
  }, [selectedBudget]);

  async function saveBudget(event) {
    event.preventDefault();
    setError("");
    if (!amount || Number(amount) <= 0) {
      setError("Budget amount must be greater than 0.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = { amount: Number(amount), month: selectedMonth };
      const savedBudget = selectedBudget ? await updateBudget(selectedBudget.id, { amount: Number(amount) }) : await createBudget(payload);
      setBudgets(selectedBudget ? budgets.map((budget) => budget.id === savedBudget.id ? savedBudget : budget) : [savedBudget, ...budgets]);
      showToast("Budget saved successfully.", "success");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-5 py-6 text-ink sm:px-8">
      <nav className="mx-auto flex max-w-6xl items-center justify-between"><button onClick={() => navigate("/")} className="flex items-center gap-3 text-lg font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-coral text-xl font-bold text-white">S</span>SpendWise</button><button onClick={() => { localStorage.removeItem("spendwise_token"); navigate("/login", { replace: true }); }} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink">Logout</button></nav>
      <section className="mx-auto max-w-5xl pb-16 pt-14"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">Plan your month</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Monthly Budget</h1><p className="mt-3 text-base text-slate-500">Set a monthly limit and keep spending in view.</p></div><label className="block text-sm font-semibold text-slate-700">Month<input className="form-input mt-2 w-full sm:w-52" type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} /></label></div>
        {error && <div className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {isLoading ? <div className="mt-10 rounded-3xl bg-white p-12 text-center text-sm text-slate-500 shadow-soft">Loading budget...</div> : <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"><section className="rounded-3xl bg-white p-7 shadow-soft sm:p-9"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">{monthLabel(selectedMonth)}</p><h2 className="mt-3 text-3xl font-semibold">{selectedBudget ? formatAmount(budgetAmount) : "No budget set"}</h2><p className="mt-2 text-sm text-slate-500">{selectedBudget ? "Your monthly spending target" : "Set a budget for this month to track progress."}</p><form onSubmit={saveBudget} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end"><label className="block flex-1 text-sm font-semibold text-slate-700">Budget amount<input className="form-input" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="15000" /></label><button className="primary-button w-full sm:w-auto" disabled={isSaving}>{isSaving ? "Saving..." : selectedBudget ? "Update Budget" : "Save Budget"}</button></form></section><section className="rounded-3xl bg-ink p-7 text-white shadow-soft sm:p-9"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Spending progress</p><div className="mt-7 flex items-end justify-between gap-4"><div><p className="text-3xl font-semibold">{formatAmount(spent)}</p><p className="mt-1 text-sm text-white/55">spent this month</p></div><p className="text-right text-sm font-semibold text-white/75">{budgetAmount > 0 ? `${percentage.toFixed(1)}% used` : "No budget"}</p></div><div className="mt-7 h-3 overflow-hidden rounded-full bg-white/15"><div className={`h-full rounded-full ${percentage > 100 ? "bg-red-400" : "bg-coral"}`} style={{ width: `${progressWidth}%` }} /></div>{!selectedBudget ? <p className="mt-5 text-sm text-white/65">No budget set for this month.</p> : percentage > 100 ? <p className="mt-5 text-sm font-semibold text-red-300">Budget exceeded by {formatAmount(Math.abs(remaining))}</p> : <div className="mt-5 flex justify-between text-sm text-white/65"><span>Remaining</span><span className="font-semibold text-white">{formatAmount(remaining)}</span></div>}</section></div>}
      </section>
    </main>
  );
}