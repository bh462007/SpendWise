import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import AuthLayout from "../components/AuthLayout";
import { loginUser } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
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

    if (!form.email || !form.password) {
      setError("Enter your email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginUser(form);
      localStorage.setItem("spendwise_token", data.access_token);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message === "Invalid email or password" ? "Invalid email or password." : requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Pick up where you left off."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-semibold text-coral hover:text-ink">Register</Link>
        </>
      }
    >
      {location.state?.message && (
        <div className="mb-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{location.state.message}</div>
      )}
      {error && <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm font-semibold text-slate-700">
          Email address
          <input className="form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Password
          <input className="form-input" type="password" name="password" value={form.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" />
        </label>
        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </AuthLayout>
  );
}