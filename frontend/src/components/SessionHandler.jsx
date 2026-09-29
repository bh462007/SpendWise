import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useToast } from "./ToastContext";

export default function SessionHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    function handleSessionExpired() {
      localStorage.removeItem("spendwise_token");
      if (location.pathname !== "/login") {
        showToast("Your session has expired. Please log in again.", "warning");
        navigate("/login", { replace: true, state: { message: "Your session has expired. Please log in again." } });
      }
    }

    window.addEventListener("spendwise:session-expired", handleSessionExpired);
    return () => window.removeEventListener("spendwise:session-expired", handleSessionExpired);
  }, [location.pathname, navigate, showToast]);

  return null;
}
