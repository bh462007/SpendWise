import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { exportReportCSV, getBudgetReport, getCategoryReport, getMonthlyReport, getReportSummary } from "../services/api";
import { useToast } from "../components/ToastContext";

const chartColors = ["#f26b5e", "#f4a261", "#2a9d8f", "#457b9d", "#e9c46a", "#8d99ae", "#6d597a", "#90be6d"];

function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);
}

function currentMonthRange() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return { start_date: `${today.getFullYear()}-${month}-01`, end_date: today.toISOString().slice(0, 10) };
}

function toDateInput(value) {
  return value.toISOString().slice(0, 10);
}

function getQuickRange(name) {
  const today = new Date();
  const endDate = toDateInput(today);
  if (name === "this-month") {
    return { start_date: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`, end_date: endDate };
  }
  if (name === "last-month") {
    const lastMonthEnd = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 0));
    const lastMonthStart = new Date(Date.UTC(lastMonthEnd.getUTCFullYear(), lastMonthEnd.getUTCMonth(), 1));
    return { start_date: toDateInput(lastMonthStart), end_date: toDateInput(lastMonthEnd) };
  }
  if (name === "last-3-months") {
    return { start_date: toDateInput(new Date(today.getFullYear(), today.getMonth() - 2, 1)), end_date: endDate };
  }
  if (name === "this-year") {
    return { start_date: `${today.getFullYear()}-01-01`, end_date: endDate };
  }
  return currentMonthRange();
}

function formatDateRange(range) {
  return `${range.start_date} to ${range.end_date}`;
}

export default function Reports() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [range, setRange] = useState(currentMonthRange());
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [budget, setBudget] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadReports(range);
  }, []);

  async function loadReports(nextRange) {
    setIsLoading(true);
    setError("");
    try {
      const month = nextRange.start_date.slice(0, 7);
      const [summaryData, categoryData, monthlyData, budgetData] = await Promise.all([
        getReportSummary(nextRange.start_date, nextRange.end_date),
        getCategoryReport(nextRange.start_date, nextRange.end_date),
        getMonthlyReport(nextRange.start_date, nextRange.end_date),
        getBudgetReport(month),
      ]);
      setSummary(summaryData);
      setCategories(categoryData.categories);
      setMonthly(monthlyData.months);
      setBudget(budgetData);
    } catch (requestError) {
      if (requestError.message.includes("credentials")) {
        localStorage.removeItem("spendwise_token");
        navigate("/login", { replace: true });
        return;
      }
      setError("Unable to load reports. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateRange(event) {
    setRange({ ...range, [event.target.name]: event.target.value });
  }

  function chooseQuickRange(name) {
    const nextRange = getQuickRange(name);
    setRange(nextRange);
    loadReports(nextRange);
  }

  function applyRange(event) {
    event.preventDefault();
    loadReports(range);
  }

  async function downloadCSV() {
    setIsExporting(true);
    try {
      const blob = await exportReportCSV(range.start_date, range.end_date);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `spendwise_report_${range.start_date}_to_${range.end_date}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast("Report exported successfully.", "success");
    } catch {
      setError("Unable to export report.");
    } finally {
      setIsExporting(false);
    }
  }

  function printReport() {
    window.print();
  }

  function logout() {
    localStorage.removeItem("spendwise_token");
    navigate("/login", { replace: true });
  }

  return (
    <main className="min-h-screen bg-cream px-5 py-6 text-ink sm:px-8">
      <nav className="print-hidden mx-auto flex max-w-7xl items-center justify-between"><button onClick={() => navigate("/")} className="flex items-center gap-3 text-lg font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-coral text-xl font-bold text-white">S</span>SpendWise</button><button onClick={logout} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-ink">Logout</button></nav>
      <section className="mx-auto max-w-7xl pb-16 pt-14"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">Financial intelligence</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Reports</h1><p className="mt-3 text-base text-slate-500">Understand your money across a chosen date range.</p></div><div className="print-hidden flex flex-wrap gap-3"><button onClick={downloadCSV} className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white hover:bg-coral" disabled={isExporting}>{isExporting ? "Preparing CSV..." : "Export CSV"}</button><button onClick={printReport} className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm hover:text-ink">Print Report</button></div></div>

        <form onSubmit={applyRange} className="print-hidden mt-9 rounded-3xl bg-white p-6 shadow-soft sm:p-7"><div className="flex flex-wrap gap-2"><QuickButton label="This Month" onClick={() => chooseQuickRange("this-month")} /><QuickButton label="Last Month" onClick={() => chooseQuickRange("last-month")} /><QuickButton label="Last 3 Months" onClick={() => chooseQuickRange("last-3-months")} /><QuickButton label="This Year" onClick={() => chooseQuickRange("this-year")} /></div><div className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="block text-sm font-semibold text-slate-700">Start Date<input className="form-input" type="date" name="start_date" value={range.start_date} onChange={updateRange} /></label><label className="block text-sm font-semibold text-slate-700">End Date<input className="form-input" type="date" name="end_date" value={range.end_date} onChange={updateRange} /></label><button className="primary-button w-full sm:w-auto">Apply Range</button></div></form>

        {error && <div className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}<button onClick={() => loadReports(range)} className="ml-3 font-semibold underline">Retry</button></div>}
        {isLoading ? <div className="mt-10 rounded-3xl bg-white p-16 text-center text-sm text-slate-500 shadow-soft">Loading reports...</div> : summary ? <div className="report-content"><p className="mt-8 text-sm text-slate-500">Report period: {formatDateRange(range)}</p><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard label="Total income" value={summary.total_income} accent="text-emerald-600" /><SummaryCard label="Total expenses" value={summary.total_expenses} accent="text-coral" /><SummaryCard label="Balance" value={summary.balance} accent={summary.balance < 0 ? "text-red-600" : "text-ink"} /><article className="rounded-2xl bg-white p-5 shadow-soft"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Transactions</p><p className="mt-4 text-2xl font-semibold text-ink">{summary.transaction_count}</p></article></div>{summary.transaction_count === 0 && <div className="mt-6 rounded-3xl bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-soft">No transactions found for this period.</div>}<div className="mt-6 grid gap-6 xl:grid-cols-2"><ReportCard title="Category spending" subtitle={categories.length ? "Expenses grouped by category" : "No expense data available for this period."}>{categories.length ? <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={categories} dataKey="amount" nameKey="category" innerRadius={75} outerRadius={110} paddingAngle={3}>{categories.map((entry, index) => <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => formatAmount(value)} /></PieChart></ResponsiveContainer> : <EmptyChart text="No expense data available for this period." />}</ReportCard><ReportCard title="Income vs expenses" subtitle="Monthly totals in the selected period">{monthly.some((month) => month.income || month.expenses) ? <ResponsiveContainer width="100%" height={300}><BarChart data={monthly} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} /><Tooltip formatter={(value) => formatAmount(value)} /><Bar dataKey="income" fill="#2a9d8f" radius={[5, 5, 0, 0]} /><Bar dataKey="expenses" fill="#f26b5e" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart text="No transaction data for this period." />}</ReportCard></div><div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><section className="rounded-3xl bg-white p-7 shadow-soft sm:p-9"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Budget report</p><h2 className="mt-2 text-2xl font-semibold">{formatAmount(budget.budget)} monthly budget</h2><div className="mt-6 grid gap-4 sm:grid-cols-3"><Metric label="Spent" value={formatAmount(budget.spent)} /><Metric label="Remaining" value={formatAmount(budget.remaining)} danger={budget.remaining < 0} /><Metric label="Percentage used" value={`${budget.percentage_used}%`} danger={budget.percentage_used > 100} /></div><div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${budget.percentage_used > 100 ? "bg-red-500" : "bg-coral"}`} style={{ width: `${Math.min(budget.percentage_used, 100)}%` }} /></div></section><section className="rounded-3xl bg-ink p-7 text-white shadow-soft sm:p-9"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Top spending category</p>{summary.top_category ? <><h2 className="mt-5 text-3xl font-semibold">{summary.top_category.category}</h2><p className="mt-2 text-lg text-white/65">{formatAmount(summary.top_category.amount)}</p></> : <p className="mt-8 text-white/65">No spending data</p>}</section></div></div> : null}
      </section>
    </main>
  );
}

function QuickButton({ label, onClick }) { return <button type="button" onClick={onClick} className="rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-coral">{label}</button>; }
function SummaryCard({ label, value, accent }) { return <article className="rounded-2xl bg-white p-5 shadow-soft"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className={`mt-4 text-2xl font-semibold tracking-tight ${accent}`}>{formatAmount(value)}</p></article>; }
function Metric({ label, value, danger }) { return <div><p className="text-xs uppercase tracking-[0.14em] text-slate-400">{label}</p><p className={`mt-2 text-lg font-semibold ${danger ? "text-red-600" : "text-ink"}`}>{value}</p></div>; }
function ReportCard({ title, subtitle, children }) { return <section className="rounded-3xl bg-white p-7 shadow-soft sm:p-9"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm text-slate-500">{subtitle}</p><div className="mt-5">{children}</div></section>; }
function EmptyChart({ text }) { return <div className="grid h-[300px] place-items-center text-center text-sm text-slate-400">{text}</div>; }
