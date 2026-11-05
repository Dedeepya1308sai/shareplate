const ICONS = {
  leaf: '<path d="M20.5 4.5c-9 0-15 4.6-15 11.4 0 2.7 1.6 4.6 4.2 4.6 6.3 0 10.8-6.9 10.8-16Z"/><path d="M4.5 20.5c2.2-5.7 5.8-9.4 10.5-11.6"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>',
  inbox: '<path d="M22 12h-5.2l-1.8 3h-6l-1.8-3H2"/><path d="M5.6 5h12.8L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6l3.6-7Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  package: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.4-3.4"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  arrowLeft: '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3.5"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mapPin: '<path d="M20 10c0 5.3-8 12-8 12S4 15.3 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/>',
  users: '<path d="M16 20v-1.8a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-1.8a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  shield: '<path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  upload: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 16v2a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-2"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="17" rx="2"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  alert: '<path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  chart: '<path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="7" rx="1"/><rect x="12.5" y="6" width="3" height="12" rx="1"/><rect x="18" y="9" width="3" height="9" rx="1"/>',
  sparkles: '<path d="m12 3 1.8 4.7L18.5 9.5 13.8 11.3 12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z"/><path d="M19 15.5 20 18l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z"/>',
  truck: '<path d="M14 17H2V5h12v12Z"/><path d="M14 8h4l4 4v5h-8"/><circle cx="6.5" cy="18.5" r="1.8"/><circle cx="17.5" cy="18.5" r="1.8"/>',
  badgeCheck: '<path d="m12 2 2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2L12 2Z"/><path d="m8.7 12 2.2 2.2 4.4-4.6"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h4"/>',
  utensils: '<path d="M7 2v8a2 2 0 0 0 2 2v10"/><path d="M3 2v5a4 4 0 0 0 8 0V2"/><path d="M17 2c-1.7 0-3 2.2-3 5s1.3 5 3 5v10"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="1.5"/><path d="M9 22v-4h6v4"/><path d="M8 6h1M15 6h1M8 10h1M15 10h1M8 14h1M15 14h1"/>',
  home: '<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10Z"/><path d="M9 22V12h6v10"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M3 3l18 18"/><path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c6.4 0 10 7 10 7a18 18 0 0 1-3.2 4.1"/><path d="M6.6 6.6C3.6 8.4 2 12 2 12s3.6 7 10 7a10 10 0 0 0 4.4-1"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  refresh: '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
  trash: '<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
};

const ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function esc(value) {
  return String(value === undefined || value === null ? "" : value).replace(
    /[&<>"']/g,
    (character) => ESCAPE_MAP[character]
  );
}

export function icon(name, size = 18, extraClass = "") {
  const markup = ICONS[name] || ICONS.info;
  return `<svg class="icon ${extraClass}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${markup}</svg>`;
}

export const CATEGORY_LABELS = {
  cooked: "Cooked meal",
  bakery: "Bakery",
  produce: "Fresh produce",
  packaged: "Packaged food",
  dairy: "Dairy",
  other: "Other",
};

export const CATEGORY_COLORS = {
  cooked: "#1b6a52",
  bakery: "#e7a33c",
  produce: "#7b9d76",
  packaged: "#2f6b8f",
  dairy: "#65569b",
  other: "#b7b1a2",
};

export const CATEGORY_ICONS = {
  cooked: "utensils",
  bakery: "package",
  produce: "leaf",
  packaged: "package",
  dairy: "heart",
  other: "file",
};

export const ROLE_META = {
  restaurant: { label: "Restaurant owner", short: "Restaurant", icon: "utensils" },
  function_hall: { label: "Function hall manager", short: "Function hall", icon: "building" },
  receiver: { label: "Food receiver", short: "Receiver", icon: "heart" },
};

export function roleLabel(role) {
  return (ROLE_META[role] || { label: role }).label;
}

export function roleShort(role) {
  return (ROLE_META[role] || { short: role }).short;
}

export function roleIcon(role) {
  return (ROLE_META[role] || { icon: "users" }).icon;
}

export function categoryLabel(category) {
  return CATEGORY_LABELS[category] || "Other";
}

export function areaOptionsHTML(areas, selected) {
  return (areas || [])
    .map(
      (area) =>
        '<option value="' +
        esc(area.name) +
        '"' +
        (area.name === selected ? " selected" : "") +
        ">" +
        esc(area.name) +
        "</option>"
    )
    .join("");
}

export function categoryOptionsHTML(selected) {
  return Object.entries(CATEGORY_LABELS)
    .map(
      ([value, label]) =>
        '<option value="' +
        esc(value) +
        '"' +
        (value === selected ? " selected" : "") +
        ">" +
        esc(label) +
        "</option>"
    )
    .join("");
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function statCardHTML({ iconName, tone = "", trend = "", trendTone = "", value, unit = "", label }) {
  return (
    '<div class="stat-card"><div class="stat-top"><span class="stat-icon"' +
    (tone ? ' data-tone="' + esc(tone) + '"' : "") +
    ">" +
    icon(iconName, 17) +
    "</span>" +
    (trend
      ? '<span class="stat-trend"' +
        (trendTone ? ' data-tone="' + esc(trendTone) + '"' : "") +
        ">" +
        esc(trend) +
        "</span>"
      : "") +
    '</div><div class="stat-value">' +
    esc(value) +
    (unit ? " <small>" + esc(unit) + "</small>" : "") +
    '</div><div class="stat-label">' +
    esc(label) +
    "</div></div>"
  );
}

export function statusMeta(status, donation) {
  let key = status;
  if (donation && donation.expired && status === "available") key = "expired";
  const map = {
    available: { label: "Available", tone: "available" },
    requested: { label: "Requests open", tone: "requested" },
    accepted: { label: "Matched", tone: "accepted" },
    picked_up: { label: "In transit", tone: "picked_up" },
    delivered: { label: "Delivered", tone: "delivered" },
    cancelled: { label: "Cancelled", tone: "cancelled" },
    expired: { label: "Expired", tone: "expired" },
    pending: { label: "Pending", tone: "requested" },
    declined: { label: "Declined", tone: "declined" },
  };
  return map[key] || { label: status, tone: "requested" };
}

export function statusPill(status, donation) {
  const meta = statusMeta(status, donation);
  return `<span class="status-pill" data-tone="${meta.tone}">${esc(meta.label)}</span>`;
}

const numberFormatter = new Intl.NumberFormat("en-IN");

export function fmtNumber(value) {
  return numberFormatter.format(Number(value) || 0);
}

export function fmtKg(value) {
  const numeric = Number(value) || 0;
  return (
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(numeric) + " kg"
  );
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("en-IN", {
  hour: "numeric",
  minute: "2-digit",
});
const weekdayFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function fmtDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export function fmtDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function fmtTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return timeFormatter.format(date);
}

export function fmtToday() {
  return weekdayFormatter.format(new Date());
}

export function timeAgo(iso) {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "";
  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 45) return "just now";
  if (seconds < 90) return "1 min ago";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return minutes + " min ago";
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + " h ago";
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return days + " days ago";
  return fmtDate(iso);
}

export function plural(count, singular, pluralWord) {
  return count + " " + (count === 1 ? singular : pluralWord || singular + "s");
}

export function initials(name) {
  const words = String(name || "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "SP";
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

const AVATAR_TONES = ["amber", "coral", "blue", "violet", "sage"];

export function avatarTone(seed) {
  let total = 0;
  for (const character of String(seed || "shareplate")) total += character.charCodeAt(0);
  return AVATAR_TONES[total % AVATAR_TONES.length];
}

export function avatarHTML(name, { size = "", tone = "" } = {}) {
  const style = size ? ` style="width:${Number(size)}px;height:${Number(size)}px;font-size:${Math.max(9, Math.round(Number(size) * 0.3))}px"` : "";
  return `<span class="avatar" data-tone="${esc(tone || avatarTone(name))}" aria-hidden="true"${style}>${esc(initials(name))}</span>`;
}

export function freshnessInfo(donation) {
  const now = Date.now();
  const expiry = new Date(donation.expiryTime).getTime();
  const prep = new Date(donation.prepTime).getTime();
  const remaining = expiry - now;
  const total = Math.max(expiry - prep, 1);
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  const hours = remaining / 3600000;

  if (remaining <= 0) {
    return { tone: "expired", text: "Safe window ended", pct: 0, remaining };
  }
  if (hours < 1) {
    return { tone: "urgent", text: Math.max(1, Math.round(remaining / 60000)) + " min left", pct, remaining };
  }
  if (hours < 3) {
    return { tone: "warn", text: hours.toFixed(1).replace(".0", "") + " h left", pct, remaining };
  }
  return { tone: "good", text: Math.round(hours) + " h left", pct, remaining };
}

export function freshnessHTML(donation) {
  const fresh = freshnessInfo(donation);
  return `<div class="freshness">
    <div class="freshness-label"><span>Freshness window</span><strong>${esc(fresh.text)}</strong></div>
    <div class="freshness-bar" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(fresh.pct)}" aria-label="Time remaining in safe window">
      <div class="freshness-fill" data-tone="${fresh.tone}" style="width:${Math.max(2, Math.round(fresh.pct))}%"></div>
    </div>
  </div>`;
}

export function toLocalInput(date = new Date()) {
  const value = new Date(date);
  const pad = (number) => String(number).padStart(2, "0");
  return (
    value.getFullYear() +
    "-" +
    pad(value.getMonth() + 1) +
    "-" +
    pad(value.getDate()) +
    "T" +
    pad(value.getHours()) +
    ":" +
    pad(value.getMinutes())
  );
}

export function toISO(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

export function setButtonBusy(button, busy) {
  if (!button) return;
  if (busy) {
    if (!button.dataset.busy) {
      button.dataset.busy = "1";
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = '<span class="spinner" aria-hidden="true"></span>Working…';
    }
  } else if (button.dataset.busy) {
    button.innerHTML = button.dataset.originalHtml || "";
    delete button.dataset.busy;
    delete button.dataset.originalHtml;
    button.disabled = false;
  }
}

const TOAST_ICONS = { success: "check", error: "alert", info: "info" };
const TOAST_TITLES = { success: "All set", error: "Something went wrong", info: "Heads up" };

export function toast(message, { type = "info", title = "", duration = 4600 } = {}) {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const element = document.createElement("div");
  element.className = "toast toast-" + type;
  element.setAttribute("role", type === "error" ? "alert" : "status");
  element.innerHTML =
    '<span class="toast-icon">' +
    icon(TOAST_ICONS[type] || "info", 14) +
    "</span>" +
    '<div class="toast-body"><strong></strong><p></p></div>' +
    '<button class="toast-close" type="button" aria-label="Dismiss notification">' +
    icon("close", 14) +
    "</button>";
  element.querySelector("strong").textContent = title || TOAST_TITLES[type] || "";
  element.querySelector("p").textContent = message;
  region.appendChild(element);

  const remove = () => {
    if (!element.isConnected) return;
    element.classList.add("is-leaving");
    window.setTimeout(() => element.remove(), 220);
  };
  element.querySelector(".toast-close").addEventListener("click", remove);
  window.setTimeout(remove, duration);
}

const modalElement = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");

modalElement.addEventListener("click", (event) => {
  if (event.target === modalElement) closeModal();
});
modalElement.addEventListener("close", () => {
  document.body.classList.remove("has-modal");
});

export function openModal(markup, { wide = false, onMount } = {}) {
  modalContent.innerHTML = markup;
  modalElement.classList.toggle("modal-wide", Boolean(wide));
  if (!modalElement.open) modalElement.showModal();
  document.body.classList.add("has-modal");
  modalContent.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeModal());
  });
  if (onMount) onMount(modalContent, modalElement);
  return modalElement;
}

export function closeModal() {
  if (modalElement.open) modalElement.close();
  modalContent.innerHTML = "";
}

export function confirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
}) {
  return new Promise((resolve) => {
    let settled = false;
    let dialog;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      closeModal();
      resolve(value);
    };
    dialog = openModal(
      '<div class="modal-head"><div><h2 id="modal-title">' +
        esc(title) +
        '</h2><p id="modal-desc">' +
        esc(message) +
        '</p></div><button type="button" class="icon-btn modal-close" data-close-modal aria-label="Close">' +
        icon("close", 16) +
        "</button></div>" +
        '<div class="modal-foot"><button type="button" class="btn btn-ghost" data-cancel>' +
        esc(cancelLabel) +
        '</button><button type="button" class="btn ' +
        (tone === "danger" ? "btn-danger" : "btn-primary") +
        '" data-confirm>' +
        esc(confirmLabel) +
        "</button></div>",
      {
        onMount(root) {
          root.querySelector("[data-confirm]").addEventListener("click", () => finish(true));
          root.querySelector("[data-cancel]").addEventListener("click", () => finish(false));
        },
      }
    );
    dialog.addEventListener(
      "close",
      () => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      },
      { once: true }
    );
  });
}

export function barChart(timeline) {
  const width = 640;
  const height = 220;
  const left = 30;
  const right = 10;
  const top = 12;
  const plotHeight = 150;
  const bottom = height - top - plotHeight;
  const maxValue = Math.max(10, ...timeline.map((entry) => entry.meals));
  const scaleMax = Math.ceil(maxValue / 10) * 10;
  const slot = (width - left - right) / timeline.length;
  const barWidth = Math.min(24, slot * 0.56);

  const grid = [0, 0.5, 1]
    .map((fraction) => {
      const y = top + plotHeight - fraction * plotHeight;
      const value = Math.round(scaleMax * fraction);
      return (
        '<line class="grid-line" x1="' +
        left +
        '" y1="' +
        y +
        '" x2="' +
        (width - right) +
        '" y2="' +
        y +
        '" />' +
        '<text x="' +
        (left - 7) +
        '" y="' +
        (y + 3) +
        '" text-anchor="end">' +
        value +
        "</text>"
      );
    })
    .join("");

  const bars = timeline
    .map((entry, index) => {
      const x = left + slot * index + (slot - barWidth) / 2;
      const barHeight = entry.meals ? Math.max(3, (entry.meals / scaleMax) * plotHeight) : 0;
      const y = top + plotHeight - barHeight;
      const isToday = index === timeline.length - 1;
      const bar = entry.meals
        ? '<rect class="bar" x="' +
          x +
          '" y="' +
          y +
          '" width="' +
          barWidth +
          '" height="' +
          barHeight +
          '" rx="4"' +
          (isToday ? ' style="fill:#e7a33c"' : "") +
          "><title>" +
          esc(fmtDate(entry.date)) +
          ": " +
          entry.meals +
          " meals</title></rect>"
        : "";
      const label =
        index % 2 === 0 || isToday
          ? '<text x="' +
            (x + barWidth / 2) +
            '" y="' +
            (height - 8) +
            '" text-anchor="middle">' +
            esc(fmtDate(entry.date)) +
            "</text>"
          : "";
      return bar + label;
    })
    .join("");

  return (
    '<svg class="bar-chart" viewBox="0 0 ' +
    width +
    " " +
    height +
    '" role="img" aria-label="Meals rescued per day over the last 14 days">' +
    "<title>Meals rescued per day over the last 14 days</title>" +
    grid +
    bars +
    "</svg>"
  );
}

export function donutChart(byCategory) {
  const total = byCategory.reduce((sum, entry) => sum + entry.meals, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  let segments = "";

  if (total > 0) {
    for (const entry of byCategory) {
      const length = (entry.meals / total) * circumference;
      const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other;
      segments +=
        '<circle cx="80" cy="80" r="' +
        radius +
        '" fill="none" stroke="' +
        color +
        '" stroke-width="17" stroke-linecap="butt" stroke-dasharray="' +
        length +
        " " +
        (circumference - length) +
        '" stroke-dashoffset="' +
        -offset +
        '" transform="rotate(-90 80 80)"><title>' +
        esc(categoryLabel(entry.category)) +
        ": " +
        entry.meals +
        " meals</title></circle>";
      offset += length;
    }
  }

  return (
    '<svg class="donut-chart" viewBox="0 0 160 160" role="img" aria-label="Meals rescued by food category">' +
    '<circle cx="80" cy="80" r="' +
    radius +
    '" fill="none" stroke="#eee7d9" stroke-width="17"/>' +
    segments +
    '<text x="80" y="77" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-size="28" fill="#0d3b2e">' +
    fmtNumber(total) +
    "</text>" +
    '<text x="80" y="94" text-anchor="middle" font-family="Inter, sans-serif" font-size="9" letter-spacing="1.4" fill="#68766c">MEALS</text>' +
    "</svg>"
  );
}

export function emptyState({ iconName = "inbox", title, body, actionLabel, actionAttrs = "" }) {
  return (
    '<div class="empty-state"><div class="empty-icon">' +
    icon(iconName, 24) +
    "</div><h4>" +
    esc(title) +
    "</h4><p>" +
    esc(body) +
    "</p>" +
    (actionLabel
      ? '<button type="button" class="btn btn-soft btn-sm" ' + actionAttrs + ">" + esc(actionLabel) + "</button>"
      : "") +
    "</div>"
  );
}

export function skeletonPage() {
  return (
    '<div class="skeleton-page">' +
    '<div class="skeleton-stats">' +
    '<div class="skeleton skeleton-card"></div>'.repeat(4) +
    "</div>" +
    '<div class="skeleton skeleton-panel"></div>' +
    "</div>"
  );
}

export function readFilePreview(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That image could not be opened."));
    image.src = source;
  });
}

export function validateImageFile(file) {
  if (!file) return "Choose a photo first.";
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return "Use a JPG, PNG or WebP image.";
  if (file.size > 10 * 1024 * 1024) return "Photo is larger than 10 MB. Please choose a smaller image.";
  return "";
}

export async function optimizeImage(file) {
  const validation = validateImageFile(file);
  if (validation) throw new Error(validation);
  const preview = await readFilePreview(file);
  try {
    const image = await loadImage(preview);
    const maxDimension = 1600;
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.84));
    if (!blob) return { file, preview };
    if (blob.size >= file.size && file.size < 5 * 1024 * 1024) {
      return { file, preview };
    }
    const optimized = new File([blob], (file.name || "photo").replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
    return { file: optimized, preview: canvas.toDataURL("image/jpeg", 0.84) };
  } catch (_) {
    return { file, preview };
  }
}

export async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) {
    /* fall through to the legacy method */
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    return copied;
  } catch (_) {
    return false;
  }
}

export function debounce(fn, wait = 180) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), wait);
  };
}
