const TOKEN_KEY = "shareplate.token";

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch (_) {
    return "";
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch (_) {
    /* storage may be unavailable */
  }
}

export function clearToken() {
  setToken("");
}

function query(params) {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  }
  const serialized = search.toString();
  return serialized ? "?" + serialized : "";
}

async function request(path, { method = "GET", body, form, auth = true } = {}) {
  const headers = {};
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;
  }
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch("/api" + path, { method, headers, body: payload });
  } catch (_) {
    throw new ApiError(0, "Can't reach the server. Make sure the backend is running and try again.");
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    if (response.status === 401 && auth && getToken()) {
      window.dispatchEvent(new CustomEvent("shareplate:unauthorized"));
    }
    throw new ApiError(
      response.status,
      data.error || "Something went wrong. Please try again.",
      data.details
    );
  }

  return data;
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body, auth: false }),
  login: (body) => request("/auth/login", { method: "POST", body, auth: false }),
  me: () => request("/auth/me"),
  logout: () => request("/auth/logout", { method: "POST" }),
  areas: () => request("/areas", { auth: false }),
  board: (params) => request("/donations" + query({ scope: "board", ...params })),
  mine: (params) => request("/donations" + query({ scope: "mine", ...params })),
  donation: (id) => request("/donations/" + encodeURIComponent(id)),
  createDonation: (form) => request("/donations", { method: "POST", form }),
  requestFood: (id, message) =>
    request("/donations/" + encodeURIComponent(id) + "/request", {
      method: "POST",
      body: { message },
    }),
  acceptRequest: (donationId, requestId) =>
    request(
      "/donations/" + encodeURIComponent(donationId) + "/requests/" + encodeURIComponent(requestId) + "/accept",
      { method: "POST" }
    ),
  declineRequest: (donationId, requestId) =>
    request(
      "/donations/" + encodeURIComponent(donationId) + "/requests/" + encodeURIComponent(requestId) + "/decline",
      { method: "POST" }
    ),
  cancelDonation: (id) =>
    request("/donations/" + encodeURIComponent(id) + "/cancel", { method: "POST" }),
  markCollected: (id) =>
    request("/donations/" + encodeURIComponent(id) + "/collected", { method: "POST" }),
  confirmDelivery: (id, form) =>
    request("/donations/" + encodeURIComponent(id) + "/confirm-delivery", {
      method: "POST",
      form,
    }),
  verifyDelivery: (id) =>
    request("/donations/" + encodeURIComponent(id) + "/verify", { method: "POST" }),
  requests: (params) => request("/requests" + query(params)),
  impact: () => request("/impact", { auth: false }),
};
