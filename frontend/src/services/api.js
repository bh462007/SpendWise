const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const { headers, ...requestOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...requestOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && localStorage.getItem("spendwise_token")) {
      window.dispatchEvent(new CustomEvent("spendwise:session-expired"));
    }
    const detail = Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail;
    const error = new Error(detail || getErrorMessage(response.status));
    error.status = response.status;
    throw error;
  }

  return data;
}

function getErrorMessage(status) {
  if (status === 400) return "Please check the information you entered.";
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "The requested item was not found.";
  if (status === 422) return "Please check the form fields and try again.";
  if (status >= 500) return "Something went wrong on the server. Please try again.";
  return "Something went wrong. Please try again.";
}

export function registerUser(userData) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export function loginUser(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function getCurrentUser(token) {
  return request("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getProfile() {
  return request("/users/me", { headers: authorizedHeaders() });
}

export function updateProfile(profileData) {
  return request("/users/me", {
    method: "PUT",
    headers: authorizedHeaders(),
    body: JSON.stringify(profileData),
  });
}

export function changePassword(passwordData) {
  return request("/users/me/password", {
    method: "PUT",
    headers: authorizedHeaders(),
    body: JSON.stringify(passwordData),
  });
}

export function deleteAccount(password) {
  return request("/users/me", {
    method: "DELETE",
    headers: authorizedHeaders(),
    body: JSON.stringify({ password }),
  });
}

function authorizedHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("spendwise_token")}`,
  };
}

function buildQueryString(parameters) {
  const query = new URLSearchParams();
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function getExpenses(filters = {}) {
  return request(`/expenses${buildQueryString(filters)}`, {
    headers: authorizedHeaders(),
  });
}

export function createExpense(expenseData) {
  return request("/expenses", {
    method: "POST",
    headers: authorizedHeaders(),
    body: JSON.stringify(expenseData),
  });
}

export function updateExpense(expenseId, expenseData) {
  return request(`/expenses/${expenseId}`, {
    method: "PUT",
    headers: authorizedHeaders(),
    body: JSON.stringify(expenseData),
  });
}

export function deleteExpense(expenseId) {
  return request(`/expenses/${expenseId}`, {
    method: "DELETE",
    headers: authorizedHeaders(),
  });
}

export function getIncome(filters = {}) {
  return request(`/income${buildQueryString(filters)}`, {
    headers: authorizedHeaders(),
  });
}

export function createIncome(incomeData) {
  return request("/income", {
    method: "POST",
    headers: authorizedHeaders(),
    body: JSON.stringify(incomeData),
  });
}

export function updateIncome(incomeId, incomeData) {
  return request(`/income/${incomeId}`, {
    method: "PUT",
    headers: authorizedHeaders(),
    body: JSON.stringify(incomeData),
  });
}

export function deleteIncome(incomeId) {
  return request(`/income/${incomeId}`, {
    method: "DELETE",
    headers: authorizedHeaders(),
  });
}

export function getBudgets() {
  return request("/budgets", {
    headers: authorizedHeaders(),
  });
}

export function createBudget(budgetData) {
  return request("/budgets", {
    method: "POST",
    headers: authorizedHeaders(),
    body: JSON.stringify(budgetData),
  });
}

export function updateBudget(budgetId, budgetData) {
  return request(`/budgets/${budgetId}`, {
    method: "PUT",
    headers: authorizedHeaders(),
    body: JSON.stringify(budgetData),
  });
}

export function getDashboardSummary() {
    return request("/dashboard/summary", {
      headers: authorizedHeaders(),
    });
  }

  export function getReportSummary(startDate, endDate) {
    return request(`/reports/summary${buildQueryString({ start_date: startDate, end_date: endDate })}`, { headers: authorizedHeaders() });
  }

  export function getCategoryReport(startDate, endDate) {
    return request(`/reports/categories${buildQueryString({ start_date: startDate, end_date: endDate })}`, { headers: authorizedHeaders() });
  }

  export function getMonthlyReport(startDate, endDate) {
    return request(`/reports/monthly${buildQueryString({ start_date: startDate, end_date: endDate })}`, { headers: authorizedHeaders() });
  }

  export function getBudgetReport(month) {
    return request(`/reports/budget${buildQueryString({ month })}`, { headers: authorizedHeaders() });
  }

  export async function exportReportCSV(startDate, endDate) {
    const response = await fetch(`${API_URL}/reports/export/csv${buildQueryString({ start_date: startDate, end_date: endDate })}`, { headers: authorizedHeaders() });
    if (!response.ok) {
      throw new Error("Unable to export report");
    }
    return response.blob();
  }