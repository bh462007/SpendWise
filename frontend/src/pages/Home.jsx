import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
  import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { getDashboardSummary } from "../services/api";
import ThemeToggle from "../components/ThemeToggle";

const chartColors = ["#f26b5e", "#f4a261", "#2a9d8f", "#457b9d", "#e9c46a", "#8d99ae", "#6d597a", "#90be6d"];

function formatAmount(value) {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
  }

function formatDate(value) {
    return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(`${value}T00:00:00Z`));
  }

const navItems = [
    ["Dashboard", "/"],
    ["Expenses", "/expenses"],
    ["Income", "/income"],
    ["Budget", "/budget"],
    ["Reports", "/reports"],
    ["Settings", "/settings"],
  ];

export default function Home() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
      getDashboardSummary()
        .then(setSummary)
        .catch((requestError) => {
          if (requestError.message.includes("credentials")) {
            localStorage.removeItem("spendwise_token");
            navigate("/login", { replace: true });
            return;
          }
          setError(requestError.message);
        });
    }, [navigate]);

    function logout() {
      localStorage.removeItem("spendwise_token");
      navigate("/login", { replace: true });
    }

    if (error) {
      return <main className="grid min-h-screen place-items-center bg-cream px-5 text-center text-sm text-red-700">{error}</main>;
    }

    if (!summary) {
      return <main className="grid min-h-screen place-items-center bg-cream text-sm text-slate-500">Loading dashboard...</main>;
    }

    const budgetProgress = Math.min(summary.budget_percentage, 100);

    return (
      <main className="min-h-screen bg-cream px-5 py-6 text-ink sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row">
          <aside className="shrink-0 lg:w-56">
            <div className="flex items-center justify-between lg:sticky lg:top-6 lg:block">
              <div className="flex items-center gap-3 text-lg font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-coral text-xl font-bold text-white">S</span>SpendWise</div>
              <div className="flex items-center gap-2 lg:mt-12"><ThemeToggle /><button onClick={logout} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white hover:text-ink lg:w-full lg:text-left">Logout</button></div>
            </div>
            <nav className="mt-7 flex gap-2 overflow-x-auto lg:sticky lg:top-36 lg:block lg:space-y-2">
              {navItems.map(([label, path]) => <NavLink key={path} to={path} end={path === "/"} className={({ isActive }) => `block whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition lg:w-full ${isActive ? "bg-ink text-white shadow-sm" : "text-slate-500 hover:bg-white hover:text-ink"}`}>{label}</NavLink>)}
            </nav>
          </aside>

          <section className="min-w-0 flex-1 pb-16">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">Financial overview</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Dashboard</h1><p className="mt-3 text-base text-slate-500">Your money, in focus for {summary.current_month}.</p></div><button onClick={() => navigate("/expenses")} className="primary-button w-auto self-start px-5 sm:self-auto">+ Add Expense</button></div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><SummaryCard label="Total income" amount={summary.total_income} accent="text-emerald-600" /><SummaryCard label="Total expenses" amount={summary.total_expenses} accent="text-coral" /><SummaryCard label="Balance" amount={summary.balance} accent={summary.balance < 0 ? "text-red-600" : "text-ink"} /><SummaryCard label="Monthly budget" amount={summary.monthly_budget} accent="text-ink" /><SummaryCard label="Budget remaining" amount={summary.budget_remaining} accent={summary.budget_remaining < 0 ? "text-red-600" : "text-emerald-600"} /></div>

            <section className="mt-6 rounded-3xl bg-white p-7 shadow-soft sm:p-9"><div className="flex items-start justify-between gap-5"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Budget progress</p><h2 className="mt-2 text-2xl font-semibold">{summary.monthly_budget ? `${summary.budget_percentage.toFixed(1)}% used` : "No budget set for this month."}</h2></div><button onClick={() => navigate("/budget")} className="rounded-xl px-3 py-2 text-sm font-semibold text-coral hover:bg-orange-50">Manage budget</button></div>{summary.monthly_budget ? <><div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${summary.budget_percentage > 100 ? "bg-red-500" : "bg-coral"}`} style={{ width: `${budgetProgress}%` }} /></div><div className="mt-4 flex justify-between text-sm text-slate-500"><span>{formatAmount(summary.budget_used)} spent</span><span>{summary.budget_remaining < 0 ? `Exceeded by ${formatAmount(Math.abs(summary.budget_remaining))}` : `${formatAmount(summary.budget_remaining)} remaining`}</span></div></> : <button onClick={() => navigate("/budget")} className="primary-button mt-6 w-auto px-5">Set Budget</button>}</section>

            <div className="mt-6 grid gap-6 xl:grid-cols-2"><ChartCard title="Expense breakdown" subtitle={summary.highest_spending_category ? `Highest category: ${summary.highest_spending_category}` : "No expense data for this month."}>{summary.category_expenses.length ? <ResponsiveContainer width="100%" height={280}><PieChart><Pie data={summary.category_expenses} dataKey="amount" nameKey="category" innerRadius={70} outerRadius={105} paddingAngle={3}>{summary.category_expenses.map((entry, index) => <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => formatAmount(value)} /></PieChart></ResponsiveContainer> : <EmptyChart text="No expense data for this month." />}</ChartCard><ChartCard title="Monthly expenses" subtitle="The last six months"><ResponsiveContainer width="100%" height={280}><BarChart data={summary.monthly_expenses} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} /><Tooltip formatter={(value) => formatAmount(value)} /><Bar dataKey="amount" fill="#f26b5e" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard></div>

            <section className="mt-6 rounded-3xl bg-white p-7 shadow-soft sm:p-9"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Latest activity</p><h2 className="mt-2 text-2xl font-semibold">Recent transactions</h2></div><button onClick={() => navigate("/expenses")} className="rounded-xl px-3 py-2 text-sm font-semibold text-coral hover:bg-orange-50">View expenses</button></div>{summary.recent_transactions.length ? <div className="mt-7 divide-y divide-slate-100">{summary.recent_transactions.map((transaction, index) => <div key={`${transaction.type}-${transaction.title}-${index}`} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div className="flex min-w-0 items-center gap-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-bold ${transaction.type === "Income" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-coral"}`}>{transaction.type === "Income" ? "+" : "−"}</span><div className="min-w-0"><p className="truncate font-semibold text-ink">{transaction.title}</p><p className="mt-1 text-xs text-slate-400">{transaction.type} · {formatDate(transaction.date)}</p></div></div><p className={`shrink-0 text-sm font-semibold ${transaction.type === "Income" ? "text-emerald-600" : "text-ink"}`}>{transaction.type === "Income" ? "+" : "−"}{formatAmount(transaction.amount)}</p></div>)}</div> : <p className="mt-7 text-sm text-slate-500">No income or expenses recorded yet.</p>}</section>
          </section>
        </div>
      </main>
    );
  }

  function SummaryCard({ label, amount, accent }) {
    return <article className="rounded-2xl bg-white p-5 shadow-soft"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className={`mt-4 text-2xl font-semibold tracking-tight ${accent}`}>{formatAmount(amount)}</p></article>;
  }

  function ChartCard({ title, subtitle, children }) {
    return <section className="rounded-3xl bg-white p-7 shadow-soft sm:p-9"><div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p></div><div className="mt-6">{children}</div></section>;
  }

  function EmptyChart({ text }) {
    return <div className="grid h-[280px] place-items-center text-center text-sm text-slate-400">{text}</div>;
  }