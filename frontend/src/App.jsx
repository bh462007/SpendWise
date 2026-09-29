import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Expenses from "./pages/Expenses";
import Income from "./pages/Income";
import Budget from "./pages/Budget";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SessionHandler from "./components/SessionHandler";

export default function App() {
  return (
    <>
      <SessionHandler />
      <Routes>
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
      <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
      <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}