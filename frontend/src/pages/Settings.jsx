import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { changePassword, deleteAccount, getProfile, updateProfile } from "../services/api";
import { useTheme } from "../components/ThemeContext";
import { useToast } from "../components/ToastContext";
import ThemeToggle from "../components/ThemeToggle";

function formatCreatedAt(value) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ name: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
      setProfileForm({ name: data.name, email: data.email });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  function updateProfileField(event) {
    setProfileForm({ ...profileForm, [event.target.name]: event.target.value });
  }

  function updatePasswordField(event) {
    setPasswordForm({ ...passwordForm, [event.target.name]: event.target.value });
  }

  async function saveProfile(event) {
    event.preventDefault();
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setIsSavingProfile(true);
    setError("");
    try {
      const updated = await updateProfile({ name: profileForm.name, email: profileForm.email });
      setProfile(updated);
      setProfileForm({ name: updated.name, email: updated.email });
      setIsEditingProfile(false);
      showToast("Profile updated successfully.", "success");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (passwordForm.new_password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    setIsChangingPassword(true);
    setError("");
    try {
      await changePassword({ current_password: passwordForm.current_password, new_password: passwordForm.new_password });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      showToast("Password changed successfully.", "success");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function confirmDeleteAccount() {
    if (!deletePassword) {
      setError("Enter your password to delete the account.");
      return;
    }
    setIsDeleting(true);
    setError("");
    try {
      await deleteAccount(deletePassword);
      localStorage.removeItem("spendwise_token");
      navigate("/login", { replace: true, state: { message: "Your account has been deleted." } });
    } catch (requestError) {
      setError(requestError.message);
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <main className="grid min-h-screen place-items-center bg-cream text-sm text-slate-500">Loading settings...</main>;
  }

  if (!profile) {
    return <main className="grid min-h-screen place-items-center bg-cream px-5 text-center text-sm text-red-700">{error || "Unable to load settings."}</main>;
  }

  return (
    <main className="min-h-screen bg-cream px-5 py-6 text-ink sm:px-8">
      <nav className="mx-auto flex max-w-5xl items-center justify-between"><button onClick={() => navigate("/")} className="flex items-center gap-3 text-lg font-semibold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-coral text-xl font-bold text-white">S</span>SpendWise</button><button onClick={() => { localStorage.removeItem("spendwise_token"); navigate("/login", { replace: true }); }} className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-white hover:text-ink">Logout</button></nav>
      <section className="mx-auto max-w-5xl pb-16 pt-14"><p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">Your account</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Settings</h1><p className="mt-3 text-base text-slate-500">Manage your profile, security, and preferences.</p>{error && <div className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="mt-10 space-y-6"><section className="rounded-3xl bg-white p-7 shadow-soft sm:p-9"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Profile</p><h2 className="mt-2 text-2xl font-semibold">Personal information</h2></div><div className="grid h-14 w-14 place-items-center rounded-2xl bg-ink text-xl font-bold text-white">{profile.name.charAt(0).toUpperCase()}</div></div>{isEditingProfile ? <form onSubmit={saveProfile} className="mt-7 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Name<input className="form-input" name="name" value={profileForm.name} onChange={updateProfileField} /></label><label className="block text-sm font-semibold text-slate-700">Email<input className="form-input" type="email" name="email" value={profileForm.email} onChange={updateProfileField} /></label><div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => { setIsEditingProfile(false); setProfileForm({ name: profile.name, email: profile.email }); }} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button><button className="primary-button w-full sm:w-auto" disabled={isSavingProfile}>{isSavingProfile ? "Saving..." : "Save Changes"}</button></div></form> : <div className="mt-7 grid gap-5 sm:grid-cols-3"><Info label="Name" value={profile.name} /><Info label="Email" value={profile.email} /><Info label="Account created" value={formatCreatedAt(profile.created_at)} /><button onClick={() => setIsEditingProfile(true)} className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-coral sm:col-span-3 sm:w-fit">Edit Profile</button></div>}</section>

          <section className="rounded-3xl bg-white p-7 shadow-soft sm:p-9"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Security</p><h2 className="mt-2 text-2xl font-semibold">Change password</h2><form onSubmit={savePassword} className="mt-7 grid gap-4 sm:grid-cols-3"><label className="block text-sm font-semibold text-slate-700">Current Password<input className="form-input" type="password" name="current_password" value={passwordForm.current_password} onChange={updatePasswordField} autoComplete="current-password" /></label><label className="block text-sm font-semibold text-slate-700">New Password<input className="form-input" type="password" name="new_password" value={passwordForm.new_password} onChange={updatePasswordField} autoComplete="new-password" /></label><label className="block text-sm font-semibold text-slate-700">Confirm New Password<input className="form-input" type="password" name="confirm_password" value={passwordForm.confirm_password} onChange={updatePasswordField} autoComplete="new-password" /></label><button className="primary-button w-full sm:col-span-3 sm:w-fit" disabled={isChangingPassword}>{isChangingPassword ? "Changing..." : "Change Password"}</button></form></section>

          <section className="rounded-3xl bg-white p-7 shadow-soft sm:p-9"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">Appearance</p><h2 className="mt-2 text-2xl font-semibold">Theme</h2><div className="mt-6 flex flex-wrap items-center gap-3"><button onClick={() => setTheme("light")} className={`rounded-xl px-5 py-3 text-sm font-semibold ${theme === "light" ? "bg-ink text-white" : "bg-slate-100 text-slate-600"}`}>Light</button><button onClick={() => setTheme("dark")} className={`rounded-xl px-5 py-3 text-sm font-semibold ${theme === "dark" ? "bg-ink text-white" : "bg-slate-100 text-slate-600"}`}>Dark</button><ThemeToggle /></div></section>

          <section className="rounded-3xl border border-red-200 bg-red-50 p-7 shadow-soft sm:p-9"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Danger zone</p><h2 className="mt-2 text-2xl font-semibold text-red-900">Delete account</h2><p className="mt-3 max-w-xl text-sm leading-6 text-red-800/75">This permanently deletes your account and all associated expenses, income, and budgets.</p><button onClick={() => { setDeletePassword(""); setIsDeleteModalOpen(true); }} className="mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700">Delete Account</button></section>
        </div>
      </section>
      {isDeleteModalOpen && <DeleteModal password={deletePassword} isDeleting={isDeleting} onChange={(event) => setDeletePassword(event.target.value)} onConfirm={confirmDeleteAccount} onClose={() => setIsDeleteModalOpen(false)} />}
    </main>
  );
}

function Info({ label, value }) { return <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 font-semibold text-ink">{value}</p></div>; }

function DeleteModal({ password, isDeleting, onChange, onConfirm, onClose }) {
  useEffect(() => { function closeOnEscape(event) { if (event.key === "Escape") onClose(); } window.addEventListener("keydown", closeOnEscape); return () => window.removeEventListener("keydown", closeOnEscape); }, [onClose]);
  return <div className="fixed inset-0 z-40 grid place-items-center bg-ink/50 px-5 backdrop-blur-sm" onMouseDown={onClose}><div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" className="w-full max-w-md rounded-3xl bg-white p-7 shadow-soft sm:p-9" onMouseDown={(event) => event.stopPropagation()}><p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-500">Danger zone</p><h2 id="delete-account-title" className="mt-3 text-2xl font-semibold">Delete Account?</h2><p className="mt-3 text-sm leading-6 text-slate-500">This action permanently deletes your account and all associated financial data. This cannot be undone.</p><label className="mt-6 block text-sm font-semibold text-slate-700">Confirm password<input className="form-input" type="password" value={password} onChange={onChange} autoFocus /></label><div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button onClick={onClose} className="rounded-xl px-5 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-100">Cancel</button><button onClick={onConfirm} disabled={isDeleting} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{isDeleting ? "Deleting..." : "Delete Account"}</button></div></div></div>;
}
