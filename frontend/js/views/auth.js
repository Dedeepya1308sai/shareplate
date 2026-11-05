import { api, setToken } from "../api.js";
import { DEMO_ACCOUNTS, DEMO_PASSWORD, state } from "../state.js";
import { areaOptionsHTML, avatarHTML, esc, icon, setButtonBusy, toast } from "../ui.js";
import { brandHTML } from "./landing.js";

const FALLBACK_AREAS = [
  "Banjara Hills",
  "Jubilee Hills",
  "Madhapur",
  "Gachibowli",
  "Kondapur",
  "Ameerpet",
  "Begumpet",
  "Secunderabad",
  "Kukatpally",
  "LB Nagar",
  "Charminar",
].map((name) => ({ name }));

const ROLE_OPTIONS = [
  { value: "restaurant", label: "Restaurant owner", hint: "Kitchens with surplus", iconName: "utensils" },
  {
    value: "function_hall",
    label: "Function hall",
    hint: "Surplus after events",
    iconName: "building",
  },
  { value: "receiver", label: "Food receiver", hint: "Community kitchen or NGO", iconName: "heart" },
];

function rolePickerHTML(selected) {
  return `<div class="role-picker" role="radiogroup" aria-label="Account type">
    ${ROLE_OPTIONS.map(
      (option) => `<label class="role-option ${option.value === selected ? "is-selected" : ""}">
        <input type="radio" name="role" value="${option.value}" ${option.value === selected ? "checked" : ""}>
        ${icon(option.iconName, 20)}
        <span>${esc(option.label)}</span>
        <small>${esc(option.hint)}</small>
      </label>`
    ).join("")}
  </div>`;
}

function demoListHTML() {
  return `<div class="auth-divider">or try a demo account</div>
    <div class="demo-list">
      ${DEMO_ACCOUNTS.map(
        (account) => `<button type="button" class="demo-btn" data-demo-email="${esc(account.email)}">
          ${avatarHTML(account.organization)}
          <span class="demo-label">
            <strong>${esc(account.label)}</strong>
            <small>${esc(account.organization)} · ${esc(account.email)}</small>
          </span>
          ${icon("arrowRight", 16)}
        </button>`
      ).join("")}
    </div>
    <p class="hint" style="margin-top:12px">Demo password for all accounts: <strong>${DEMO_PASSWORD}</strong></p>`;
}

function loginFormHTML() {
  return `<form class="auth-form" id="auth-form" novalidate>
    <div class="form-error" data-form-error role="alert"></div>
    <label class="field" for="login-email">
      <span class="field-label">Email address</span>
      <input class="input" id="login-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
    </label>
    <label class="field" for="login-password">
      <span class="field-label">Password</span>
      <span class="input-wrap">
        <input class="input" id="login-password" name="password" type="password" autocomplete="current-password" placeholder="Your password" required>
        <button type="button" class="icon-btn" data-toggle-password aria-label="Show password">${icon("eye", 16)}</button>
      </span>
    </label>
    <div class="form-actions" style="margin-top:6px">
      <button type="submit" class="btn btn-primary btn-lg btn-block">${icon("lock", 16)}Sign in</button>
    </div>
    <p class="hint" style="text-align:center">New to SharePlate? <a href="#/register">Create an account</a></p>
  </form>`;
}

function registerFormHTML(areas, selectedRole) {
  return `<form class="auth-form" id="auth-form" novalidate>
    <div class="form-error" data-form-error role="alert"></div>
    ${rolePickerHTML(selectedRole)}
    <label class="field" for="register-name">
      <span class="field-label">Your name</span>
      <input class="input" id="register-name" name="name" type="text" autocomplete="name" placeholder="e.g. Priya Sharma" minlength="2" maxlength="60" required>
    </label>
    <label class="field" for="register-organization">
      <span class="field-label">Organization / kitchen name</span>
      <input class="input" id="register-organization" name="organization" type="text" autocomplete="organization" placeholder="e.g. Green Fork Kitchen" minlength="2" maxlength="80" required>
    </label>
    <div class="field-row">
      <label class="field" for="register-email">
        <span class="field-label">Email address</span>
        <input class="input" id="register-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" required>
      </label>
      <label class="field" for="register-phone">
        <span class="field-label">Phone number</span>
        <input class="input" id="register-phone" name="phone" type="tel" autocomplete="tel" placeholder="+91 98765 43210" pattern="[+()0-9][0-9 ()\-+]{6,19}" required>
      </label>
    </div>
    <div class="field-row">
      <label class="field" for="register-area">
        <span class="field-label">Area</span>
        <select class="select" id="register-area" name="area" required>
          <option value="">Choose your area</option>
          ${areaOptionsHTML(areas)}
        </select>
      </label>
      <label class="field" for="register-address">
        <span class="field-label">Street address</span>
        <input class="input" id="register-address" name="address" type="text" autocomplete="street-address" placeholder="Building, street, landmark" minlength="5" maxlength="160" required>
      </label>
    </div>
    <div class="field-row">
      <label class="field" for="register-password">
        <span class="field-label">Password</span>
        <span class="input-wrap">
          <input class="input" id="register-password" name="password" type="password" autocomplete="new-password" placeholder="At least 8 characters" minlength="8" required>
          <button type="button" class="icon-btn" data-toggle-password aria-label="Show password">${icon("eye", 16)}</button>
        </span>
      </label>
      <label class="field" for="register-confirm">
        <span class="field-label">Confirm password</span>
        <input class="input" id="register-confirm" name="confirm" type="password" autocomplete="new-password" placeholder="Repeat your password" minlength="8" required>
      </label>
    </div>
    <div class="form-actions" style="margin-top:6px">
      <button type="submit" class="btn btn-primary btn-lg btn-block">${icon("sparkles", 16)}Create my account</button>
    </div>
    <p class="hint" style="text-align:center">Already have an account? <a href="#/login">Sign in</a></p>
  </form>`;
}

export function renderAuth(ctx, mode) {
  const areas = state.areas.length ? state.areas : FALLBACK_AREAS;
  const query = ctx.route.query || {};
  const selectedRole = ROLE_OPTIONS.some((option) => option.value === query.role)
    ? query.role
    : "restaurant";
  const isLogin = mode === "login";

  const result = {
    docTitle: (isLogin ? "Sign in" : "Create your account") + " · SharePlate",
    html: `<main id="view-root">
      <div class="auth-layout">
        <div class="auth-form-side">
          <a class="auth-back" href="#/">${icon("arrowLeft", 15)}Back to SharePlate</a>
          <div class="auth-card">
            <span class="eyebrow">${isLogin ? "Welcome back" : "Join the food rescue"}</span>
            <h1 style="margin-top:14px">${isLogin ? "Pick up where you left off." : "Share surplus. Receive what you need."}</h1>
            <p class="auth-sub">${isLogin ? "Sign in to manage your listings, requests and delivery proofs." : "Create a free account for your kitchen, banquet hall or community organization."}</p>
            <nav class="auth-tabs" aria-label="Account forms">
              <a class="auth-tab ${isLogin ? "is-active" : ""}" href="#/login">Sign in</a>
              <a class="auth-tab ${!isLogin ? "is-active" : ""}" href="#/register">Create account</a>
            </nav>
            ${isLogin ? loginFormHTML() : registerFormHTML(areas, selectedRole)}
            ${demoListHTML()}
          </div>
        </div>
        <aside class="auth-visual">
          ${brandHTML()}
          <div class="auth-quote">
            <blockquote>“The food was already cooked. The only missing ingredient was coordination.”</blockquote>
            <p>SharePlate gives surplus a route to a plate — with a handover code and a photo to prove it arrived.</p>
            <div class="auth-steps">
              <div class="auth-step"><span>1</span>Post surplus with a safe-until window</div>
              <div class="auth-step"><span>2</span>Match with a nearby community kitchen</div>
              <div class="auth-step"><span>3</span>Confirm handover with code and photo proof</div>
            </div>
          </div>
          <span class="auth-visual-foot">Hyderabad pilot · 2026</span>
        </aside>
      </div>
    </main>`,
    mount(root) {
      bindAuth(root, ctx, mode);
    },
  };
  return result;
}

function bindAuth(root, ctx, mode) {
  const form = root.querySelector("#auth-form");
  const errorBox = root.querySelector("[data-form-error]");
  const next = safeNext(ctx.route.query && ctx.route.query.next);
  const value = (name) => {
    const field = form.elements.namedItem(name);
    return field ? field.value : "";
  };

  root.querySelectorAll('input[name="role"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      root.querySelectorAll(".role-option").forEach((option) => {
        option.classList.toggle("is-selected", option.querySelector("input").checked);
      });
    });
  });

  root.querySelectorAll("[data-toggle-password]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button.closest(".input-wrap").querySelector("input");
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      button.innerHTML = icon(show ? "eyeOff" : "eye", 16);
      button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
  });

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add("is-visible");
    errorBox.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  async function finishSignIn(payload) {
    setToken(payload.token);
    state.user = payload.user;
    toast("Welcome, " + payload.user.organization + ".", { type: "success" });
    ctx.navigate(next || "/dashboard");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.remove("is-visible");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const submit = form.querySelector('button[type="submit"]');

    if (mode === "login") {
      const email = value("email").trim();
      const password = value("password");
      if (!email || !password) {
        showError("Enter your email and password to continue.");
        return;
      }
      setButtonBusy(submit, true);
      try {
        const payload = await api.login({ email, password });
        await finishSignIn(payload);
      } catch (error) {
        setButtonBusy(submit, false);
        showError(error.message);
      }
      return;
    }

    if (value("password") !== value("confirm")) {
      showError("Your passwords do not match.");
      return;
    }
    if (value("password").length < 8) {
      showError("Choose a password with at least 8 characters.");
      return;
    }
    const role = form.querySelector('input[name="role"]:checked');
    if (!role) {
      showError("Choose the type of account you need.");
      return;
    }
    setButtonBusy(submit, true);
    try {
      const payload = await api.register({
        name: value("name"),
        email: value("email"),
        password: value("password"),
        role: role.value,
        organization: value("organization"),
        phone: value("phone"),
        area: value("area"),
        address: value("address"),
      });
      await finishSignIn(payload);
    } catch (error) {
      setButtonBusy(submit, false);
      showError(error.message);
    }
  });

  root.querySelectorAll("[data-demo-email]").forEach((button) => {
    button.addEventListener("click", async () => {
      const email = button.getAttribute("data-demo-email");
      setButtonBusy(button, true);
      errorBox.classList.remove("is-visible");
      try {
        const payload = await api.login({ email, password: DEMO_PASSWORD });
        await finishSignIn(payload);
      } catch (error) {
        setButtonBusy(button, false);
        showError(error.message);
      }
    });
  });
}

function safeNext(value) {
  if (typeof value !== "string") return "";
  if (!value.startsWith("/") || value.startsWith("//")) return "";
  return value;
}
