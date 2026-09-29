import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "../components/AuthLayout";
import { registerUser } from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("spendwise_token")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await registerUser({ name: form.name, email: form.email, password: form.password });
      navigate("/login", { state: { message: "Account created. You can now log in." } });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Start fresh"
      title="Create your money space."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-coral hover:text-ink">Login</Link>
        </>
      }
    >
      {error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Name
          <input className="form-input" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Bhagyashree" autoComplete="name" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Email address
          <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" autoComplete="new-password" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Confirm password
          <input className="form-input" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password" autoComplete="new-password" />
        </label>
        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthLayout>
  );
}