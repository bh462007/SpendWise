import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return <main className="grid min-h-screen place-items-center bg-cream px-5 text-center text-ink"><div><p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">SpendWise</p><h1 className="mt-4 text-7xl font-semibold tracking-tight">404</h1><p className="mt-4 text-lg text-slate-500">Page not found.</p><button onClick={() => navigate("/")} className="primary-button mt-8 w-auto px-6">Back to Dashboard</button></div></main>;
}
