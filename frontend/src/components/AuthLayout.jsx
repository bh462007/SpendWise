import { Link } from "react-router-dom";

export default function AuthLayout({ title, eyebrow, children, footer }) {
  return (
    <main className="min-h-screen bg-cream px-5 py-8 text-ink sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] bg-white shadow-soft lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden min-h-[680px] overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-coral/80 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full border-[32px] border-white/10" />
            <Link to="/login" className="relative flex items-center gap-3 text-lg font-semibold tracking-tight">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-coral text-xl font-bold text-white">S</span>
              SpendWise
            </Link>
            <div className="relative max-w-sm">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-coral">A calmer money routine</p>
              <h2 className="text-4xl font-semibold leading-tight tracking-tight">Make room for the things that matter.</h2>
              <p className="mt-5 text-base leading-7 text-white/65">A simple, private home for building better spending habits one clear decision at a time.</p>
            </div>
            <p className="relative text-sm text-white/45">Your money, in focus.</p>
          </section>

          <section className="flex min-h-[680px] items-center justify-center p-7 sm:p-12">
            <div className="w-full max-w-md">
              <div className="mb-9 lg:hidden">
                <Link to="/login" className="flex items-center gap-3 text-lg font-semibold tracking-tight">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-coral text-xl font-bold text-white">S</span>
                  SpendWise
                </Link>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coral">{eyebrow}</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
              <div className="mt-8">{children}</div>
              <div className="mt-8 text-center text-sm text-slate-500">{footer}</div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}