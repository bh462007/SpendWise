import { createContext, useContext, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  function showToast(message, type = "info") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
  {toast && <Toast message={toast.message} type={toast.type} />}
    </ToastContext.Provider>
  );
}

function Toast({ message, type }) {
  const colors = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return <div role="status" className={`fixed bottom-5 right-5 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm font-semibold shadow-soft ${colors[type] || colors.info}`}>{message}</div>;
}

export function useToast() {
  return useContext(ToastContext);
}
