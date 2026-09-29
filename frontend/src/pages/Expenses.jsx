import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createExpense, deleteExpense, getExpenses, updateExpense } from "../services/api";
import { useToast } from "../components/ToastContext";

const categories = ["Food", "Travel", "Shopping", "Bills", "Education", "Health", "Entertainment", "Other"];
const paymentMethods = ["Cash", "UPI", "Debit Card", "Credit Card", "Bank Transfer", "Other"];
const defaultFilters = { search: "", category: "", payment_method: "", start_date: "", end_date: "", sort_by: "date", sort_order: "desc" };

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm() {
  return { title: "", amount: "", category: "Food", date: today(), payment_method: "UPI", note: "" };
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function formatAmount(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

function friendlyError(error) {
  return error.message.includes("credentials") ? "Your session has expired. Please log in again." : "Unable to load expenses. Please try again.";
}

export default function Expenses() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [result, setResult] = useState({ items: [], page: 1, limit: 10, total_items: 0, total_pages: 0 });
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadExpenses(defaultFilters, 1);
  }, []);

  async function loadExpenses(nextFilters, pageNumber) {
    setIsLoading(true);
    setError("");
    try {
      const response = await getExpenses({ ...nextFilters, page: pageNumber, limit: 10 });
      setResult(response);
    } catch (requestError) {
      if (requestError.message.includes("credentials")) {
        localStorage.removeItem("spendwise_token");
        navigate("/login", { replace: true });
        return;
      }
      setError(friendlyError(requestError));
    } finally {
      setIsLoading(false);
    }
  }

  function updateFilter(event) {
    setFilters({ ...filters, [event.target.name]: event.target.value });
  }

  function updateSort(event) {
    const [sortBy, sortOrder] = event.target.value.split("-");
    setFilters({ ...filters, sort_by: sortBy, sort_order: sortOrder });
  }

  function applyFilters(event) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
    loadExpenses(filters, 1);
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    loadExpenses(defaultFilters, 1);
  }

  function openCreateForm() {
    setEditingExpense(null);
    setForm(emptyForm());
    setError("");
    setIsFormOpen(true);
  }

  function openEditForm(expense) {
    setEditingExpense(expense);
    setForm({ title: expense.title, amount: String(expense.amount), category: expense.category, date: expense.date, payment_method: expense.payment_method, note: expense.note || "" });
    setError("");
    setIsFormOpen(true);
  }

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    setIsSaving(true);
    const payload = { ...form, title: form.title.trim(), amount: Number(form.amount), note: form.note.trim() || null };
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, payload);
      } else {
        await createExpense(payload);
      }
      setIsFormOpen(false);
      showToast(editingExpense ? "Expense updated successfully." : "Expense added successfully.", "success");
      await loadExpenses(appliedFilters, editingExpense ? result.page : 1);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
      showToast("Expense deleted successfully.", "success");
      const nextPage = result.items.length === 1 && result.page > 1 ? result.page - 1 : result.page;
      await loadExpenses(appliedFilters, nextPage);
    } catch (requestError) {
      setError(requestError.message);
      setDeletingExpense(null);
    } finally {
      setIsDeleting(false);
    }
  }

  const hasFilters = Object.entries(appliedFilters).some(([key, value]) => !["sort_by", "sort_order"].includes(key) && value);
  const rangeStart = result.total_items === 0 ? 0 : (result.page - 1) * result.limit + 1;
  const rangeEnd = Math.min(result.page * result.limit, result.total_items);
  const sortValue = `${filters.sort_by}-${filters.sort_order}`;

  return (
    <main className="min-h-screen bg-cream px-5 py-6 text-ink sm:px-8">
      <nav className="mx-auto flex max-w-6xl items-center justify-between"><button onClick={() => navigate("/")} className="flex items-center gap-3 text-lg font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-coral text-xl font-bold text-white">S</span>SpendWise</button><button onClick={() => { localStorage.removeItem("spendwise_token"); navigate("/login", { replace: true }); }} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-ink">Logout</button></nav>
      <section className="mx-auto max-w-6xl pb-16 pt-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">Your activity</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Expenses</h1><p className="mt-3 text-base text-slate-500">Search and sort the spending you have recorded.</p></div><button onClick={openCreateForm} className="primary-button w-auto self-start px-5 sm:self-auto">+ Add Expense</button></div>

        <form onSubmit={applyFilters} className="mt-9 rounded-3xl bg-white p-6 shadow-soft sm:p-7"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"><label className="block text-sm font-semibold text-slate-700 lg:col-span-2">Search expenses<input className="form-input" name="search" value={filters.search} onChange={updateFilter} placeholder="Search expenses..." /></label><label className="block text-sm font-semibold text-slate-700">Category<select className="form-input" name="category" value={filters.category} onChange={updateFilter}><option value="">All Categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Payment method<select className="form-input" name="payment_method" value={filters.payment_method} onChange={updateFilter}><option value="">All Payment Methods</option>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Start date<input className="form-input" type="date" name="start_date" value={filters.start_date} onChange={updateFilter} /></label><label className="block text-sm font-semibold text-slate-700">End date<input className="form-input" type="date" name="end_date" value={filters.end_date} onChange={updateFilter} /></label><label className="block text-sm font-semibold text-slate-700 lg:col-span-2">Sort by<select className="form-input" value={sortValue} onChange={updateSort}><option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="amount-desc">Highest amount</option><option value="amount-asc">Lowest amount</option><option value="title-asc">Title A-Z</option><option value="title-desc">Title Z-A</option></select></label></div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={clearFilters} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100">Clear Filters</button><button className="primary-button w-full sm:w-auto sm:min-w-36">Apply Filters</button></div></form>

        {error && <div className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {isLoading ? <div className="mt-10 rounded-3xl bg-white p-12 text-center text-sm text-slate-500 shadow-soft">Loading expenses...</div> : result.total_items === 0 ? <EmptyState hasFilters={hasFilters} onClear={clearFilters} onAdd={openCreateForm} /> : <><div className="mt-10 hidden overflow-hidden rounded-3xl bg-white shadow-soft md:block"><ExpenseTable items={result.items} onEdit={openEditForm} onDelete={setDeletingExpense} /></div><div className="mt-6 space-y-4 md:hidden">{result.items.map((expense) => <ExpenseCard key={expense.id} expense={expense} onEdit={openEditForm} onDelete={setDeletingExpense} />)}</div><Pagination page={result.page} totalPages={result.total_pages} rangeStart={rangeStart} rangeEnd={rangeEnd} totalItems={result.total_items} onPageChange={(page) => loadExpenses(appliedFilters, page)} /></>}
      </section>
      {isFormOpen && <ExpenseFormModal form={form} editingExpense={editingExpense} isSaving={isSaving} error={error} onChange={handleChange} onSubmit={handleSubmit} onClose={() => setIsFormOpen(false)} />}
      {deletingExpense && <ConfirmDeleteModal expense={deletingExpense} isDeleting={isDeleting} onConfirm={confirmDelete} onClose={() => setDeletingExpense(null)} />}
    </main>
  );
}

function ExpenseTable({ items, onEdit, onDelete }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-slate-100 text-xs uppercase tracking-[0.16em] text-slate-400"><tr><th className="px-6 py-5 font-semibold">Title</th><th className="px-6 py-5 font-semibold">Category</th><th className="px-6 py-5 font-semibold">Date</th><th className="px-6 py-5 font-semibold">Payment method</th><th className="px-6 py-5 text-right font-semibold">Amount</th><th className="px-6 py-5 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-slate-100 text-sm">{items.map((expense) => <tr key={expense.id} className="transition hover:bg-orange-50/30"><td className="px-6 py-5"><p className="font-semibold text-ink">{expense.title}</p>{expense.note && <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">{expense.note}</p>}</td><td className="px-6 py-5"><span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">{expense.category}</span></td><td className="px-6 py-5 text-slate-500">{formatDate(expense.date)}</td><td className="px-6 py-5 text-slate-500">{expense.payment_method}</td><td className="px-6 py-5 text-right text-base font-semibold text-ink">{formatAmount(expense.amount)}</td><td className="px-6 py-5"><Actions expense={expense} onEdit={onEdit} onDelete={onDelete} /></td></tr>)}</tbody></table></div>;
}

function ExpenseCard({ expense, onEdit, onDelete }) {
  return <article className="rounded-2xl bg-white p-5 shadow-soft"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{expense.title}</h2><p className="mt-1 text-xs text-slate-400">{expense.note || "No note"}</p></div><p className="text-lg font-semibold text-ink">{formatAmount(expense.amount)}</p></div><div className="mt-5 grid grid-cols-2 gap-3 text-sm"><p><span className="block text-xs text-slate-400">Category</span><span className="font-semibold">{expense.category}</span></p><p><span className="block text-xs text-slate-400">Date</span><span className="font-semibold">{formatDate(expense.date)}</span></p><p><span className="block text-xs text-slate-400">Payment</span><span className="font-semibold">{expense.payment_method}</span></p></div><div className="mt-5 border-t border-slate-100 pt-4"><Actions expense={expense} onEdit={onEdit} onDelete={onDelete} /></div></article>;
}

function Actions({ expense, onEdit, onDelete }) {
  return <div className="flex justify-end gap-2"><button onClick={() => onEdit(expense)} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-ink">Edit</button><button onClick={() => onDelete(expense)} className="rounded-lg px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50">Delete</button></div>;
}

function Pagination({ page, totalPages, rangeStart, rangeEnd, totalItems, onPageChange }) {
  if (totalPages <= 1) return <p className="mt-5 text-right text-sm text-slate-500">Showing {rangeStart}–{rangeEnd} of {totalItems} expenses</p>;
  return <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm sm:flex-row"><p className="text-slate-500">Showing {rangeStart}–{rangeEnd} of {totalItems} expenses</p><div className="flex items-center gap-2"><button onClick={() => onPageChange(page - 1)} disabled={page === 1} className="rounded-lg px-3 py-2 font-semibold text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">Previous</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} onClick={() => onPageChange(number)} className={`h-9 w-9 rounded-lg font-semibold ${number === page ? "bg-ink text-white" : "text-slate-500 hover:bg-white"}`}>{number}</button>)}<button onClick={() => onPageChange(page + 1)} disabled={page === totalPages} className="rounded-lg px-3 py-2 font-semibold text-slate-500 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></div>;
}

function EmptyState({ hasFilters, onClear, onAdd }) {
  return <div className="mt-10 rounded-3xl bg-white px-6 py-16 text-center shadow-soft"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-orange-50 text-2xl text-coral">+</div><h2 className="mt-5 text-xl font-semibold">{hasFilters ? "No expenses found matching your filters." : "Start tracking your expenses."}</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{hasFilters ? "Try changing your search or clearing the filters." : "Add your first expense to begin understanding your spending."}</p><button onClick={hasFilters ? onClear : onAdd} className="primary-button mt-7 w-auto px-5">{hasFilters ? "Clear Filters" : "Add Expense"}</button></div>;
}

function ExpenseFormModal({ form, editingExpense, isSaving, error, onChange, onSubmit, onClose }) {
  return <div className="fixed inset-0 z-20 grid place-items-center bg-ink/40 px-5 py-6 backdrop-blur-sm"><div className="max-h-[calc(100vh-3rem)] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-7 shadow-soft sm:p-9"><div className="flex items-start justify-between gap-5"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">{editingExpense ? "Edit entry" : "New entry"}</p><h2 className="mt-2 text-2xl font-semibold">{editingExpense ? "Update expense" : "Add expense"}</h2></div><button onClick={onClose} className="rounded-lg px-2 py-1 text-2xl leading-none text-slate-400 hover:bg-slate-100" aria-label="Close">×</button></div>{error && <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<form onSubmit={onSubmit} className="mt-7 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Title<input className="form-input" name="title" value={form.title} onChange={onChange} placeholder="College Canteen" /></label><label className="block text-sm font-semibold text-slate-700">Amount<input className="form-input" type="number" min="0.01" step="0.01" name="amount" value={form.amount} onChange={onChange} placeholder="120" /></label><label className="block text-sm font-semibold text-slate-700">Date<input className="form-input" type="date" name="date" value={form.date} onChange={onChange} /></label><label className="block text-sm font-semibold text-slate-700">Category<select className="form-input" name="category" value={form.category} onChange={onChange}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700">Payment method<select className="form-input" name="payment_method" value={form.payment_method} onChange={onChange}>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</select></label><label className="block text-sm font-semibold text-slate-700 sm:col-span-2">Note <span className="font-normal text-slate-400">(optional)</span><textarea className="form-input min-h-24 resize-y" name="note" value={form.note} onChange={onChange} placeholder="Lunch with friends" /></label><div className="mt-3 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button><button className="primary-button w-full sm:w-auto sm:min-w-36" disabled={isSaving}>{isSaving ? "Saving..." : editingExpense ? "Save changes" : "Add Expense"}</button></div></form></div></div>;
}

function ConfirmDeleteModal({ expense, isDeleting, onConfirm, onClose }) {
  return <div className="fixed inset-0 z-30 grid place-items-center bg-ink/40 px-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-soft sm:p-9"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Delete expense</p><h2 className="mt-3 text-2xl font-semibold">Are you sure you want to delete this expense?</h2><p className="mt-3 text-sm leading-6 text-slate-500">“{expense.title}” will be permanently removed.</p><div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button onClick={onClose} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button><button onClick={onConfirm} className="rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60" disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete"}</button></div></div></div>;
}
