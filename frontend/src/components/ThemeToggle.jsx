import { useTheme } from "./ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return <button onClick={toggleTheme} className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-white hover:text-ink dark:hover:bg-slate-800" aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? "Light" : "Dark"}</button>;
}
