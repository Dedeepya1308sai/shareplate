import { api, clearToken, getToken } from "./api.js";
import { state } from "./state.js";
import {
  avatarHTML,
  closeModal,
  esc,
  fmtToday,
  icon,
  roleShort,
  skeletonPage,
  timeAgo,
  toast,
} from "./ui.js";
import { openDonationModal, openRequestModal } from "./components.js";
import { renderLanding, siteFooter, siteHeader } from "./views/landing.js";
import { renderAuth } from "./views/auth.js";
import { renderDonorDashboard, renderGive } from "./views/donor.js";
import { renderBoard, renderConfirm, renderReceiverDashboard } from "./views/receiver.js";
import { renderRequests } from "./views/requests.js";
import { renderImpact } from "./views/impact.js";

const appRoot = document.getElementById("app");
const ROUTE_TITLES = {
  "/dashboard": "Overview",
  "/board": "Food board",
  "/give": "Post surplus",
  "/requests": "Requests",
  "/impact": "Impact",
};

let renderSequence = 0;
let pendingScroll = "";
let requestBadge = 0;
let handlingUnauthorized = false;

function bootLoaderHTML() {
  return `<div style="min-height:100vh;display:grid;place-items:center">
    <span class="spinner" style="width:30px;height:30px;color:var(--forest-700)" aria-label="Loading SharePlate"></span>
  </div>`;
}

function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [pathPart, queryPart = ""] = raw.split("?");
  let path = pathPart || "/";
  if (!path.startsWith("/")) path = "/" + path;
  if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
  return {
    path,
    query: Object.fromEntries(new URLSearchParams(queryPart)),
    search: queryPart ? "?" + queryPart : "",
  };
}

function isAppPath(path) {
  if (path === "/dashboard" || path === "/board" || path === "/give" || path === "/requests") {
    return true;
  }
  if (path.startsWith("/confirm/")) return true;
  if (path === "/impact") return Boolean(state.user);
  if (path === "/" || path === "/login" || path === "/register") return false;
  return Boolean(state.user);
}

function defaultTitle(path) {
  if (path.startsWith("/confirm/")) return "Confirm delivery";
  return ROUTE_TITLES[path] || "SharePlate";
}

function navigate(path) {
  if (typeof path !== "string" || !path.startsWith("/")) return;
  closeDropdowns();
  const target = "#" + path;
  if (window.location.hash === target) {
    renderRoute();
    return;
  }
  window.location.hash = target;
}

function createContext() {
  const ctx = {
    user: state.user,
    route: state.route,
    navigate,
    refresh: () => renderRoute(),
    openDonation: (id) => openDonationModal(id, ctx),
    requestFood: (donation) => openRequestModal(donation, ctx),
  };
  ctx.onRequest = ctx.requestFood;
  return ctx;
}

function closeDropdowns() {
  document.querySelectorAll(".dropdown.is-open").forEach((element) => {
    element.classList.remove("is-open");
  });
  document
    .querySelectorAll("[data-bell-toggle], [data-avatar-toggle]")
    .forEach((element) => element.setAttribute("aria-expanded", "false"));
}

function toggleDropdown(kind) {
  const dropdown = document.querySelector("[data-" + kind + "-dropdown]");
  const trigger = document.querySelector("[data-" + kind + "-toggle]");
  if (!dropdown) return;
  const willOpen = !dropdown.classList.contains("is-open");
  closeDropdowns();
  if (willOpen) {
    dropdown.classList.add("is-open");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }
}

function toggleSidebar(force) {
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("app-scrim");
  if (!sidebar) return;
  const open = force === undefined ? !sidebar.classList.contains("is-open") : Boolean(force);
  sidebar.classList.toggle("is-open", open);
  if (scrim) scrim.classList.toggle("is-open", open);
  const button = document.querySelector("[data-sidebar-toggle]");
  if (button) button.setAttribute("aria-expanded", String(open));
}

function isActivePath(itemPath, routePath) {
  if (itemPath === "/requests") {
    return routePath === "/requests" || routePath.startsWith("/confirm/");
  }
  return itemPath === routePath;
}

function sidebarNavHTML(role, routePath) {
  const groups =
    role === "receiver"
      ? [
          {
            label: "Workspace",
            items: [
              { path: "/dashboard", iconName: "grid", label: "Overview" },
              { path: "/board", iconName: "search", label: "Food nearby" },
            ],
          },
          {
            label: "Handovers",
            items: [
              { path: "/requests", iconName: "inbox", label: "My requests", badge: true },
              { path: "/impact", iconName: "chart", label: "Impact" },
            ],
          },
        ]
      : [
          {
            label: "Workspace",
            items: [
              { path: "/dashboard", iconName: "grid", label: "Overview" },
              { path: "/give", iconName: "plus", label: "Post surplus" },
            ],
          },
          {
            label: "Network",
            items: [
              { path: "/board", iconName: "search", label: "Food board" },
              { path: "/requests", iconName: "inbox", label: "Requests", badge: true },
              { path: "/impact", iconName: "chart", label: "Impact" },
            ],
          },
        ];

  return `<nav class="side-nav" aria-label="Workspace">
    ${groups
      .map(
        (group) => `<div>
          <div class="side-group-label">${esc(group.label)}</div>
          ${group.items
            .map((item) => {
              const active = isActivePath(item.path, routePath);
              return `<a class="side-link ${active ? "is-active" : ""}" href="#${item.path}" data-nav="${item.path}"${active ? ' aria-current="page"' : ""}>
                ${icon(item.iconName, 18)}
                <span>${esc(item.label)}</span>
                ${item.badge ? `<span class="side-badge" data-request-badge hidden></span>` : ""}
              </a>`;
            })
            .join("")}
        </div>`
      )
      .join("")}
  </nav>`;
}

function inboxItemsHTML() {
  if (!state.inbox.length) {
    return `<div class="notif-empty">You're all caught up. Requests and delivery updates appear here.</div>`;
  }
  return state.inbox
    .map(
      (item) => `<button type="button" class="notif-item" data-nav="${esc(item.path)}">
        <span class="notif-icon">${icon(item.iconName, 16)}</span>
        <span class="notif-copy">
          <strong>${esc(item.title)}</strong>
          <small>${esc(item.body)}${item.when ? " · " + esc(timeAgo(item.when)) : ""}</small>
        </span>
      </button>`
    )
    .join("");
}

function topbarHTML(user, title, subtitle) {
  return `<header class="topbar">
    <div class="topbar-left">
      <button type="button" class="icon-btn hamburger" data-sidebar-toggle aria-label="Open navigation" aria-expanded="false" aria-controls="sidebar">
        ${icon("menu", 18)}
      </button>
      <div class="page-title-block">
        <div class="page-title-line">
          <h1>${esc(title)}</h1>
          <span class="role-tag">${esc(roleShort(user.role))}</span>
        </div>
        <p>${esc(subtitle || user.organization + " · " + user.area)}</p>
      </div>
    </div>
    <div class="topbar-actions">
      <span class="date-chip">${icon("calendar", 15)}${esc(fmtToday())}</span>
      <div class="bell-wrap">
        <button type="button" class="icon-btn bell-btn" data-bell-toggle aria-label="Notifications" aria-haspopup="true" aria-expanded="false">
          ${icon("bell", 18)}
          <span class="bell-badge" data-notif-badge></span>
        </button>
        <div class="dropdown" data-notif-dropdown>
          <div class="dropdown-head">
            <strong>Notifications</strong>
            <span data-notif-summary>Requests and delivery updates</span>
          </div>
          <div data-notif-list>${inboxItemsHTML()}</div>
        </div>
      </div>
      <div class="avatar-wrap">
        <button type="button" class="avatar-trigger" data-avatar-toggle aria-haspopup="true" aria-expanded="false" aria-label="Account menu">
          ${avatarHTML(user.organization, { size: 38 })}
          ${icon("chevronDown", 15)}
        </button>
        <div class="dropdown avatar-menu" data-avatar-dropdown>
          <div class="avatar-menu-head">
            ${avatarHTML(user.organization, { size: 42 })}
            <div>
              <strong>${esc(user.organization)}</strong>
              <span>${esc(user.name)}</span>
              <small>${esc(user.email)} · ${esc(user.area)}</small>
            </div>
          </div>
          <a class="menu-item" href="#/dashboard" data-nav="/dashboard">${icon("grid", 16)}Dashboard</a>
          <a class="menu-item" href="${user.role === "receiver" ? "#/board" : "#/give"}" data-nav="${user.role === "receiver" ? "/board" : "/give"}">
            ${icon(user.role === "receiver" ? "search" : "plus", 16)}${user.role === "receiver" ? "Find food" : "Post surplus"}
          </a>
          <a class="menu-item" href="#/requests" data-nav="/requests">${icon("inbox", 16)}Requests</a>
          <a class="menu-item" href="#/impact" data-nav="/impact">${icon("chart", 16)}Impact</a>
          <button type="button" class="menu-item is-danger" data-logout>${icon("logout", 16)}Sign out</button>
        </div>
      </div>
    </div>
  </header>`;
}

function mobileNavHTML(user, routePath) {
  const isReceiver = user.role === "receiver";
  const items = [
    { path: "/dashboard", iconName: "grid", label: "Home" },
    isReceiver
      ? { path: "/board", iconName: "search", label: "Find food" }
      : { path: "/give", iconName: "plus", label: "Post" },
    { path: "/requests", iconName: "inbox", label: "Requests", badge: true },
    { path: "/impact", iconName: "chart", label: "Impact" },
  ];
  return `<nav class="mobile-nav" aria-label="Quick navigation">
    ${items
      .map((item) => {
        const active = isActivePath(item.path, routePath);
        return `<a class="mobile-nav-item ${active ? "is-active" : ""}" href="#${item.path}" data-nav="${item.path}"${active ? ' aria-current="page"' : ""}>
          ${icon(item.iconName, 19)}
          <span>${esc(item.label)}</span>
          ${item.badge ? `<span class="m-badge" data-mobile-request-badge hidden></span>` : ""}
        </a>`;
      })
      .join("")}
  </nav>`;
}

function shellHTML({ user, title, subtitle, content, route }) {
  const isReceiver = user.role === "receiver";
  return `<div class="app-shell">
    <aside class="sidebar" id="sidebar" aria-label="Workspace navigation">
      <div class="sidebar-inner">
        <a class="brand" href="#/dashboard" data-nav="/dashboard" aria-label="SharePlate dashboard">
          <span class="brand-mark">${icon("leaf", 19)}</span>
          <span class="brand-text">
            <span class="brand-name">SharePlate</span>
            <span class="brand-sub">Smart food redistribution</span>
          </span>
        </a>
        <div class="sidebar-cta">
          <a class="btn btn-accent btn-block" href="${isReceiver ? "#/board" : "#/give"}" data-nav="${isReceiver ? "/board" : "/give"}">
            ${icon(isReceiver ? "search" : "plus", 16)}${isReceiver ? "Find food nearby" : "Post surplus"}
          </a>
        </div>
        ${sidebarNavHTML(user.role, route.path)}
        <div class="sidebar-foot">
          <div class="side-profile">
            ${avatarHTML(user.organization, { size: 38 })}
            <div class="side-profile-info">
              <strong>${esc(user.organization)}</strong>
              <span>${esc(user.name)} · ${esc(user.area)}</span>
            </div>
          </div>
          <button type="button" class="side-logout" data-logout>${icon("logout", 16)}Sign out</button>
        </div>
      </div>
    </aside>
    <div class="app-scrim" id="app-scrim" data-app-scrim></div>
    <div class="app-main">
      ${topbarHTML(user, title, subtitle)}
      <main id="view-root" class="page-content" tabindex="-1">${content}</main>
    </div>
    ${mobileNavHTML(user, route.path)}
  </div>`;
}

function analyzeRequests(requests, role) {
  const items = [];
  let badge = 0;

  if (role === "receiver") {
    for (const request of requests) {
      const active =
        request.status === "accepted" &&
        (request.donation.status === "accepted" || request.donation.status === "picked_up");
      if (active) {
        badge += 1;
        items.push({
          iconName: "camera",
          title: "Ready to confirm delivery",
          body: request.donation.foodName + " from " + (request.donor ? request.donor.organization : "the donor"),
          when: request.respondedAt || request.createdAt,
          path: "/requests",
        });
      }
    }
  } else {
    for (const request of requests) {
      if (request.status === "pending") {
        badge += 1;
        items.push({
          iconName: "inbox",
          title: "Request from " + (request.receiver ? request.receiver.organization : "a receiver"),
          body: request.donation.foodName + " · " + request.donation.servings + " servings",
          when: request.createdAt,
          path: "/requests",
        });
      } else if (request.donation.status === "delivered" && !request.donation.verifiedByDonor) {
        items.push({
          iconName: "badgeCheck",
          title: "Delivery proof to verify",
          body: request.donation.foodName + " · " + (request.receiver ? request.receiver.organization : "receiver"),
          when: request.donation.deliveredAt,
          path: "/requests",
        });
      }
    }
  }

  items.sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));
  return { items: items.slice(0, 6), badge };
}

function paintInbox() {
  const count = state.inbox.length;
  document.querySelectorAll("[data-notif-badge]").forEach((badge) => {
    if (count) {
      badge.textContent = count > 9 ? "9+" : String(count);
      badge.classList.add("is-visible");
    } else {
      badge.textContent = "";
      badge.classList.remove("is-visible");
    }
  });
  document.querySelectorAll("[data-notif-list]").forEach((list) => {
    list.innerHTML = inboxItemsHTML();
  });
  document.querySelectorAll("[data-notif-summary]").forEach((summary) => {
    summary.textContent = count
      ? count + (count === 1 ? " update needs attention" : " updates need attention")
      : "You're all caught up";
  });
  document.querySelectorAll("[data-request-badge], [data-mobile-request-badge]").forEach((badge) => {
    badge.textContent = requestBadge ? (requestBadge > 9 ? "9+" : String(requestBadge)) : "";
    badge.hidden = !requestBadge;
  });
}

async function refreshInbox(renderId) {
  if (!state.user) {
    state.inbox = [];
    requestBadge = 0;
    paintInbox();
    return;
  }
  try {
    const response = await api.requests();
    if (renderId && renderId !== renderSequence) return;
    const summary = analyzeRequests(response.requests || [], state.user.role);
    state.inbox = summary.items;
    requestBadge = summary.badge;
  } catch (_) {
    if (renderId && renderId !== renderSequence) return;
    state.inbox = [];
    requestBadge = 0;
  }
  paintInbox();
}

function resolveView(ctx, route) {
  switch (route.path) {
    case "/":
      return renderLanding(ctx);
    case "/login":
      return renderAuth(ctx, "login");
    case "/register":
      return renderAuth(ctx, "register");
    case "/impact":
      return renderImpact(ctx);
    case "/dashboard":
      return state.user && state.user.role === "receiver"
        ? renderReceiverDashboard(ctx)
        : renderDonorDashboard(ctx);
    case "/board":
      return renderBoard(ctx);
    case "/give":
      return renderGive(ctx);
    case "/requests":
      return renderRequests(ctx);
    default:
      if (route.path.startsWith("/confirm/")) {
        const id = decodeURIComponent(route.path.slice("/confirm/".length));
        return id ? renderConfirm(ctx, { id }) : null;
      }
      return null;
  }
}

function errorView(error, ctx, appRoute) {
  const status = error && error.status;
  const notFound = status === 404 || !error;
  const heading = notFound ? "We couldn't find that page." : "Something went wrong.";
  const message = notFound
    ? "The link may be out of date, or the record may no longer be available to your account."
    : error.message || "Please try again in a moment.";
  const actions = ctx.user
    ? `<a class="btn btn-primary" href="#/dashboard" data-nav="/dashboard">${icon("grid", 15)}Back to dashboard</a>
       <a class="btn btn-soft" href="#/" data-nav="/">Go to home</a>`
    : `<a class="btn btn-primary" href="#/" data-nav="/">Back to home</a>
       <a class="btn btn-soft" href="#/login" data-nav="/login">Sign in</a>`;
  const content = `<div class="page-head">
      <div>
        <h2>${esc(heading)}</h2>
        <p>${esc(message)}</p>
      </div>
    </div>
    <section class="panel"><div class="empty-state">
      <div class="empty-icon">${icon(notFound ? "search" : "alert", 24)}</div>
      <h4>${esc(notFound ? "Page not found" : "The request failed")}</h4>
      <p>${esc(message)}</p>
      <div class="success-actions" style="justify-content:center">${actions}</div>
    </div></section>`;

  if (appRoute) {
    return {
      docTitle: (notFound ? "Not found" : "Error") + " · SharePlate",
      title: notFound ? "Not found" : "Error",
      subtitle: "SharePlate",
      html: content,
      mount() {},
    };
  }
  return {
    docTitle: (notFound ? "Not found" : "Error") + " · SharePlate",
    html: `${siteHeader(ctx)}
      <main id="view-root" class="landing">
        <section class="section"><div class="wrap">${content}</div></section>
      </main>
      ${siteFooter()}`,
    mount() {},
  };
}

async function renderView(view, ctx, route, appRoute, renderId) {
  if (appRoute) {
    appRoot.innerHTML = shellHTML({
      user: ctx.user,
      title: view.title || defaultTitle(route.path),
      subtitle: view.subtitle,
      content: view.html,
      route,
    });
    document.title = view.docTitle || view.title + " · SharePlate";
    paintInbox();
    const contentRoot = document.getElementById("view-root");
    try {
      if (view.mount) await view.mount(contentRoot);
    } catch (error) {
      console.error("[view]", error);
      toast("Part of this page could not load. Try refreshing.", { type: "error" });
    }
    refreshInbox(renderId);
  } else {
    appRoot.innerHTML = view.html;
    document.title = view.docTitle || "SharePlate";
    const contentRoot = document.getElementById("view-root") || appRoot;
    try {
      if (view.mount) await view.mount(contentRoot);
    } catch (error) {
      console.error("[view]", error);
      toast("Part of this page could not load. Try refreshing.", { type: "error" });
    }
  }

  if (pendingScroll) {
    const target = document.getElementById(pendingScroll);
    pendingScroll = "";
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }
  window.scrollTo({ top: 0, behavior: "auto" });
}

async function renderRoute(options = {}) {
  const renderId = ++renderSequence;
  let route = parseHash();
  state.route = route;

  if (isAppPath(route.path) && !state.user) {
    history.replaceState(null, "", "#/login?next=" + encodeURIComponent(route.path + route.search));
    return renderRoute(options);
  }
  if (state.user && (route.path === "/login" || route.path === "/register")) {
    history.replaceState(null, "", "#/dashboard");
    return renderRoute(options);
  }
  if (state.user && route.path === "/give" && state.user.role === "receiver") {
    toast("Only restaurants and function halls can post surplus. Browse the food board instead.", {
      type: "info",
    });
    history.replaceState(null, "", "#/dashboard");
    return renderRoute(options);
  }
  if (
    state.user &&
    route.path.startsWith("/confirm/") &&
    state.user.role !== "receiver"
  ) {
    toast("Only the matched receiver can confirm a delivery.", { type: "info" });
    history.replaceState(null, "", "#/requests");
    return renderRoute(options);
  }

  closeModal();
  closeDropdowns();
  toggleSidebar(false);

  const appRoute = isAppPath(route.path);
  const ctx = createContext();
  route = state.route;

  if (appRoute) {
    appRoot.innerHTML = shellHTML({
      user: ctx.user,
      title: defaultTitle(route.path),
      subtitle: "Loading your workspace…",
      content: skeletonPage(),
      route,
    });
    document.title = defaultTitle(route.path) + " · SharePlate";
    paintInbox();
  } else {
    appRoot.innerHTML = bootLoaderHTML();
  }

  let view;
  try {
    view = await resolveView(ctx, route);
  } catch (error) {
    if (renderId !== renderSequence) return;
    if (error && error.status === 401) {
      handleUnauthorized();
      return;
    }
    view = errorView(error, ctx, appRoute);
  }

  if (renderId !== renderSequence) return;
  if (!view) view = errorView(null, ctx, appRoute);
  await renderView(view, ctx, route, appRoute, renderId);
}

function handleUnauthorized() {
  if (handlingUnauthorized) return;
  if (!state.user && !getToken()) return;
  handlingUnauthorized = true;
  clearToken();
  state.user = null;
  state.inbox = [];
  requestBadge = 0;
  closeModal();
  closeDropdowns();
  toast("Your session has expired. Please sign in again.", { type: "info" });
  const route = parseHash();
  const next = isAppPath(route.path) ? "?next=" + encodeURIComponent(route.path + route.search) : "";
  navigate("/login" + next);
  window.setTimeout(() => {
    handlingUnauthorized = false;
  }, 500);
}

async function logout() {
  closeDropdowns();
  toggleSidebar(false);
  try {
    await api.logout();
  } catch (_) {
    /* the local session is cleared either way */
  }
  clearToken();
  state.user = null;
  state.inbox = [];
  requestBadge = 0;
  closeModal();
  toast("You're signed out.", { type: "info" });
  navigate("/");
}

let globalHandlersBound = false;

function bindGlobalHandlers() {
  if (globalHandlersBound) return;
  globalHandlersBound = true;

  document.addEventListener("click", (event) => {
    const sidebarToggle = event.target.closest("[data-sidebar-toggle]");
    if (sidebarToggle) {
      event.preventDefault();
      toggleSidebar();
      return;
    }

    const scrim = event.target.closest("[data-app-scrim]");
    if (scrim) {
      toggleSidebar(false);
      return;
    }

    const bell = event.target.closest("[data-bell-toggle]");
    if (bell) {
      event.preventDefault();
      toggleDropdown("notif");
      return;
    }

    const avatar = event.target.closest("[data-avatar-toggle]");
    if (avatar) {
      event.preventDefault();
      toggleDropdown("avatar");
      return;
    }

    const nav = event.target.closest("[data-nav]");
    if (nav) {
      event.preventDefault();
      toggleSidebar(false);
      navigate(nav.getAttribute("data-nav"));
      return;
    }

    const logoutButton = event.target.closest("[data-logout]");
    if (logoutButton) {
      event.preventDefault();
      logout();
      return;
    }

    const scrollLink = event.target.closest("[data-scroll]");
    if (scrollLink) {
      event.preventDefault();
      const id = scrollLink.getAttribute("data-scroll");
      if (parseHash().path !== "/") {
        pendingScroll = id;
        navigate("/");
      } else {
        const target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    if (!event.target.closest(".bell-wrap") && !event.target.closest(".avatar-wrap")) {
      closeDropdowns();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeDropdowns();
      toggleSidebar(false);
    }
  });

  window.addEventListener("hashchange", () => renderRoute());
  window.addEventListener("shareplate:unauthorized", handleUnauthorized);
}

async function init() {
  appRoot.innerHTML = bootLoaderHTML();
  try {
    const response = await api.areas();
    state.areas = response.areas || [];
  } catch (_) {
    state.areas = [];
  }

  if (getToken()) {
    try {
      const response = await api.me();
      state.user = response.user;
    } catch (error) {
      if (error && error.status === 401) {
        clearToken();
      } else {
        clearToken();
        toast("Could not restore your session. Please sign in again.", { type: "error" });
      }
    }
  }

  bindGlobalHandlers();
  if (!window.location.hash) history.replaceState(null, "", "#/");
  await renderRoute();
}

init();
