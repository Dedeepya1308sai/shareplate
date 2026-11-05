import { api } from "../api.js";
import { avatarHTML, esc, fmtKg, fmtNumber, icon } from "../ui.js";

export function brandHTML({ sub = true } = {}) {
  return `<a class="brand" href="#/" aria-label="SharePlate home">
    <span class="brand-mark">${icon("leaf", 19)}</span>
    <span class="brand-text">
      <span class="brand-name">SharePlate</span>
      ${sub ? '<span class="brand-sub">Smart food redistribution</span>' : ""}
    </span>
  </a>`;
}

export function siteHeader(ctx) {
  const user = ctx.user;
  return `<header class="site-header">
    <div class="wrap site-header-inner">
      ${brandHTML()}
      <nav class="site-nav" aria-label="Main navigation">
        <a href="#/" data-scroll="how-it-works">How it works</a>
        <a href="#/" data-scroll="proof">Delivery proof</a>
        <a href="#/impact">Impact</a>
        <a href="#/" data-scroll="for-you">For you</a>
      </nav>
      <div class="site-actions">
        ${
          user
            ? `<a class="btn btn-ghost btn-sm" href="#/dashboard">Dashboard</a><a class="btn btn-accent btn-sm" href="#/dashboard">${icon("grid", 15)}Open app</a>`
            : `<a class="btn btn-ghost btn-sm" href="#/login">Log in</a><a class="btn btn-accent btn-sm" href="#/register">Join the network</a>`
        }
      </div>
    </div>
  </header>`;
}

export function siteFooter() {
  return `<footer class="site-footer">
    <div class="wrap">
      <div class="footer-inner">
        <div>
          ${brandHTML()}
          <p>SharePlate connects surplus food from restaurants and function halls with nearby community kitchens, with photo-proof handovers and live status tracking.</p>
        </div>
        <div class="footer-links">
          <a href="#/" data-scroll="how-it-works">How it works</a>
          <a href="#/" data-scroll="proof">Delivery proof</a>
          <a href="#/impact">Impact</a>
          <a href="#/register">Join</a>
          <a href="#/login">Log in</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2026 SharePlate · Smart Food Waste Redistribution</span>
        <span>Hyderabad pilot · Prototype for community food rescue</span>
      </div>
    </div>
  </footer>`;
}

function heroActions(user) {
  if (!user) {
    return `<a class="btn btn-accent btn-lg" href="#/register?role=restaurant">${icon("plus", 17)}Donate surplus</a>
      <a class="btn btn-soft btn-lg" href="#/register?role=receiver">${icon("search", 17)}Find food nearby</a>`;
  }
  if (user.role === "receiver") {
    return `<a class="btn btn-accent btn-lg" href="#/board">${icon("search", 17)}Find food nearby</a>
      <a class="btn btn-soft btn-lg" href="#/requests">${icon("inbox", 17)}My requests</a>`;
  }
  return `<a class="btn btn-accent btn-lg" href="#/give">${icon("plus", 17)}Post surplus food</a>
    <a class="btn btn-soft btn-lg" href="#/dashboard">${icon("grid", 17)}Open dashboard</a>`;
}

function audienceAction(user, role) {
  if (user) return `<a class="btn btn-light btn-sm" href="#/dashboard">Open your dashboard ${icon("arrowRight", 14)}</a>`;
  return `<a class="btn btn-light btn-sm" href="#/register?role=${encodeURIComponent(role)}">Join the network ${icon("arrowRight", 14)}</a>`;
}

export function renderLanding(ctx) {
  const user = ctx.user;
  return {
    docTitle: "SharePlate · Smart Food Waste Redistribution",
    html: `${siteHeader(ctx)}
    <main id="view-root" class="landing">
      <div class="wrap">
        <section class="hero">
          <div class="hero-copy">
            <span class="eyebrow">Surplus food, matched in minutes</span>
            <h1>Good food belongs on plates, <em>not in bins.</em></h1>
            <p>SharePlate connects restaurants and function halls with nearby community kitchens so every safe, surplus meal reaches a person instead of a landfill — with live tracking and photo proof at every handover.</p>
            <div class="hero-actions">${heroActions(user)}</div>
            <div class="hero-trust">
              <div class="avatar-stack" aria-hidden="true">
                ${avatarHTML("Green Fork Kitchen")}
                ${avatarHTML("Grand Lotus Banquets")}
                ${avatarHTML("Asha Community Kitchen")}
                ${avatarHTML("Hope Shelter Trust")}
              </div>
              <p><strong>Restaurants, banquet halls and community kitchens</strong><br>rescuing food together across Hyderabad.</p>
            </div>
          </div>
          <div class="hero-visual">
            <div class="hero-frame">
              <img src="/assets/hero.jpg" alt="A community kitchen volunteer handing over a packed tray of fresh food" />
            </div>
            <div class="float-card float-meals">
              ${icon("utensils", 20)}
              <div>
                <strong data-impact="availableMeals">—</strong>
                <span class="float-sub">meals available right now</span>
              </div>
            </div>
            <div class="float-card float-proof">
              ${icon("badgeCheck", 20)}
              <div>
                <strong>A handover trail</strong>
                <small>Code-verified, with photo proof</small>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section class="section section--tight">
        <div class="wrap">
          <div class="impact-band">
            <div>
              <span class="eyebrow eyebrow--light">Live network impact</span>
              <h2>Small handovers. Measurable change.</h2>
              <p>Every confirmed delivery is measured in meals, weight and avoided emissions — not just good intentions.</p>
              <a class="btn btn-light btn-sm" href="#/impact" style="margin-top:20px">See the full impact report ${icon("arrowRight", 14)}</a>
            </div>
            <div class="impact-grid">
              <div class="impact-item"><strong data-impact="meals">—</strong><span>Meals shared</span></div>
              <div class="impact-item"><strong data-impact="weight">—</strong><span>Food rescued</span></div>
              <div class="impact-item"><strong data-impact="co2">—</strong><span>CO₂e avoided</span></div>
              <div class="impact-item"><strong data-impact="verified">—</strong><span>Verified deliveries</span></div>
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="how-it-works">
        <div class="wrap">
          <div class="section-head">
            <div>
              <span class="eyebrow">From surplus to supper</span>
              <h2>A four-step handover, built for trust.</h2>
            </div>
            <p>The workflow from our project blueprint: post, match, hand over safely, then close the loop with photo proof.</p>
          </div>
          <div class="steps">
            <article class="step">
              <span class="step-num">1</span>
              <h3>Post surplus</h3>
              <p>Add the food, quantity, preparation time, safe-until window, pickup area and a photo. Freshness is calculated automatically.</p>
              <span class="step-icon">${icon("camera", 26)}</span>
            </article>
            <article class="step">
              <span class="step-num">2</span>
              <h3>Match nearby</h3>
              <p>Community kitchens see live food sorted by distance and safe window. They request what they can collect in time.</p>
              <span class="step-icon">${icon("mapPin", 26)}</span>
            </article>
            <article class="step">
              <span class="step-num">3</span>
              <h3>Hand over safely</h3>
              <p>When the donor accepts, a 4-digit handover code is generated. Both sides see the contact details they need.</p>
              <span class="step-icon">${icon("shield", 26)}</span>
            </article>
            <article class="step">
              <span class="step-num">4</span>
              <h3>Prove delivery</h3>
              <p>The receiver uploads a confirmation photo and enters the code. The donor sees the proof and verifies delivery.</p>
              <span class="step-icon">${icon("badgeCheck", 26)}</span>
            </article>
          </div>
        </div>
      </section>

      <section class="problem" id="why">
        <div class="wrap section">
          <div class="section-head">
            <div>
              <span class="eyebrow">Why it matters</span>
              <h2>Great food is thrown away while people go hungry.</h2>
            </div>
            <p>Surplus isn't a supply problem. It is a coordination problem — and software can close the gap.</p>
          </div>
          <div class="problem-grid">
            <div class="problem-card">
              <strong>1 in 3<span> meals</span></strong>
              <p>Around a third of all food produced in the world is lost or wasted before it is eaten.</p>
            </div>
            <div class="problem-card">
              <strong>8–10<span>%</span></strong>
              <p>Food loss and waste generate 8–10% of global greenhouse gas emissions.</p>
            </div>
            <div class="problem-card">
              <strong>733M<span> people</span></strong>
              <p>Hundreds of millions faced hunger in recent years while edible surplus was discarded.</p>
            </div>
            <div class="problem-card">
              <strong>2.5<span> kg</span></strong>
              <p>Estimated CO₂e avoided per kilogram of food rescued in this prototype's impact model.</p>
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="proof">
        <div class="wrap">
          <div class="section-head">
            <div>
              <span class="eyebrow">Proof, not promises</span>
              <h2>Every delivery leaves a verifiable trail.</h2>
            </div>
            <p>Handover codes, photo proof and a donor verification step make the closed loop the default.</p>
          </div>
          <div class="feature-grid">
            <article class="feature-card feature-card--wide">
              <span class="feature-icon">${icon("badgeCheck", 22)}</span>
              <div>
                <h3>Photo-verified handovers</h3>
                <p>The receiver uploads a delivery photo and the donor's 4-digit code. Only then does the status become Delivered. The donor can review the proof and verify it.</p>
              </div>
              <img class="feature-image" src="/assets/food-sandwiches.jpg" alt="Freshly packed sandwiches ready for handover" loading="lazy" />
            </article>
            <article class="feature-card feature-card--wide">
              <span class="feature-icon">${icon("mapPin", 22)}</span>
              <div>
                <h3>Distance-aware matching</h3>
                <p>Receivers see food closest to their area first, so surplus is collected while it is still fresh and the pickup trip stays short.</p>
              </div>
              <img class="feature-image" src="/assets/food-produce.jpg" alt="Fresh produce packed for a community kitchen" loading="lazy" />
            </article>
            <article class="feature-card">
              <span class="feature-icon">${icon("clock", 22)}</span>
              <h3>Freshness windows</h3>
              <p>Prep and safe-until times create a live freshness bar, so nobody has to guess whether food is still safe to share.</p>
            </article>
            <article class="feature-card">
              <span class="feature-icon">${icon("truck", 22)}</span>
              <h3>Live status tracking</h3>
              <p>Listed, matched, collected, delivered. Both sides see the same journey and the next action they need to take.</p>
            </article>
            <article class="feature-card">
              <span class="feature-icon">${icon("chart", 22)}</span>
              <h3>Impact built in</h3>
              <p>Meals, kilograms, CO₂e, verified deliveries and a 14-day rescue chart update with every confirmed handover.</p>
            </article>
          </div>
        </div>
      </section>

      <section class="section" id="for-you">
        <div class="wrap">
          <div class="section-head">
            <div>
              <span class="eyebrow">Built for every side of the table</span>
              <h2>One plate. Three kinds of hands.</h2>
            </div>
            <p>Separate workspaces for restaurants, function halls and receivers — connected by one live food board.</p>
          </div>
          <div class="audience-grid">
            <article class="audience-card">
              <img src="/assets/food-biryani.jpg" alt="Restaurant kitchen with trays of biryani" loading="lazy" />
              <span class="role-tag">Restaurant owners</span>
              <h3>Turn tonight's surplus into tomorrow's impact.</h3>
              <p>Post extra portions in under a minute, review incoming requests, and keep a verified record of every delivery.</p>
              ${audienceAction(user, "restaurant")}
            </article>
            <article class="audience-card">
              <img src="/assets/food-banquet.jpg" alt="Banquet buffet with surplus food after an event" loading="lazy" />
              <span class="role-tag">Function hall managers</span>
              <h3>An event ends. The impact doesn't.</h3>
              <p>Share buffet surplus with nearby community kitchens, coordinate pickup windows and track the handover.</p>
              ${audienceAction(user, "function_hall")}
            </article>
            <article class="audience-card">
              <img src="/assets/food-produce.jpg" alt="Community kitchen receiving fresh food" loading="lazy" />
              <span class="role-tag">Food receivers</span>
              <h3>Find safe food nearby, when you need it.</h3>
              <p>Browse live surplus sorted by distance, request what you can collect, and confirm each delivery with a photo.</p>
              ${audienceAction(user, "receiver")}
            </article>
          </div>
        </div>
      </section>

      <section class="section section--tight">
        <div class="wrap">
          <div class="cta-band">
            <div>
              <span class="eyebrow eyebrow--light">Start a handover</span>
              <h2>Tonight's surplus can be tomorrow's meal.</h2>
              <p>Join the SharePlate pilot as a restaurant, function hall or community kitchen. Post surplus, request food, and prove every delivery with a photo.</p>
            </div>
            <div class="hero-actions">
              ${
                user
                  ? `<a class="btn btn-accent btn-lg" href="#/dashboard">Open your dashboard ${icon("arrowRight", 16)}</a>`
                  : `<a class="btn btn-accent btn-lg" href="#/register?role=restaurant">${icon("plus", 17)}Join as a donor</a>
                     <a class="btn btn-light btn-lg" href="#/register?role=receiver">Join as a receiver</a>`
              }
            </div>
          </div>
        </div>
      </section>
    </main>
    ${siteFooter()}`,
    mount(root) {
      loadLiveImpact(root);
    },
  };
}

async function loadLiveImpact(root) {
  let impact;
  try {
    const response = await api.impact();
    impact = response.impact;
  } catch (_) {
    return;
  }
  const values = {
    meals: fmtNumber(impact.meals),
    weight: fmtKg(impact.weightKg),
    co2: new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 }).format(impact.co2Kg) + " kg",
    verified: fmtNumber(impact.verifiedDeliveries),
    availableMeals: fmtNumber(impact.availableMeals),
  };
  for (const [key, value] of Object.entries(values)) {
    root.querySelectorAll('[data-impact="' + key + '"]').forEach((element) => {
      element.textContent = value;
    });
  }
}
