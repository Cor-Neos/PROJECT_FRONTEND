// Centralized API client
// Minimal wrapper around fetch with base URL and JSON handling.
const BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://mfphlwdn-3000.asse.devtunnels.ms/api";

function buildUrl(path) {
  if (!path.startsWith("/")) path = "/" + path;
  return BASE_URL + path;
}

async function request(path, { method = "GET", body, headers = {}, ...rest } = {}) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const preparedBody = body == null ? undefined :
    isFormData ? body : (typeof body === "string" ? body : JSON.stringify(body));

  const autoContentType = !isFormData && preparedBody ? { "Content-Type": typeof preparedBody === "string" && !(body instanceof Object) ? "text/plain" : "application/json" } : {};

  const opts = {
    method,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...autoContentType,
      ...headers,
    },
    ...(preparedBody ? { body: preparedBody } : {}),
    ...rest,
  };

  const res = await fetch(buildUrl(path), opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const error = new Error(data?.message || `Request failed (${res.status})`);
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export const api = {
  get: (path, opts) => request(path, { method: "GET", ...opts }),
  post: (path, body, opts) => request(path, { method: "POST", body, ...opts }),
  put: (path, body, opts) => request(path, { method: "PUT", body, ...opts }),
  del: (path, opts) => request(path, { method: "DELETE", ...opts }),
  raw: request,
  baseUrl: BASE_URL,
};

export default api;
