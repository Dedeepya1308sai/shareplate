import { api } from "../api.js";
import {
  avatarHTML,
  barChart,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  categoryLabel,
  donutChart,
  esc,
  fmtDate,
  fmtDateTime,
  fmtKg,
  fmtNumber,
  icon,
  roleShort,
} from "../ui.js";
import { siteFooter, siteHeader } from "./landing.js";

function metricGridHTML(impact) {
  return `<div class="metric-grid">
    <div class="metric"><strong>${fmtNumber(impact.meals)}</strong><span>Meals shared</span></div>
    <div class="metric"><strong>${fmtKg(impact.weightKg)}</strong><span>Food rescued</span></div>
    <div class="metric"><strong>${fmtKg(impact.co2Kg)}</strong><span>CO₂e avoided</span></div>
    <div class="metric"><strong>${fmtNumber(impact.verifiedDeliveries)}<small> / ${fmtNumber(impact.deliveries)}</small></strong><span>Verified handovers</span></div>
  </div>`;
}

function legendHTML(byCategory) {
  if (!byCategory.length) {
    return `<p class="hint">No confirmed deliveries yet. Category totals appear after the first photo-verified handover.</p>`;
  }
  return `<div class="legend">${byCategory
    .map(
      (entry) => `<div class="legend-row">
        <span class="legend-swatch" style="background:${CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.other}"></span>
        <span>${esc(categoryLabel(entry.category))}</span>
        <strong>${fmtNumber(entry.meals)}</strong>
      </div>`
    )
    .join("")}</div>`;
}

function donorRowsHTML(topDonors) {
  if (!topDonors.length) {
    return `<div class="empty-state empty-state--small">
      <div class="empty-icon">${icon("heart", 22)}</div>
      <h4>No confirmed handovers yet</h4>
      <p>Rescue partners appear here once their first delivery is confirmed with photo proof.</p>
    </div>`;
  }
  return `<div class="leaderboard">${topDonors
    .map(
      (donor, index) => `<div class="leader-row">
        <span class="rank" data-rank="${index + 1}">${index + 1}</span>
        ${avatarHTML(donor.organization)}
        <div class="leader-main">
          <strong>${esc(donor.organization)}</strong>
          <span>${esc(roleShort(donor.role))} · ${fmtNumber(donor.deliveries)} deliveries · ${fmtNumber(donor.verified)} verified</span>
        </div>
        <div class="leader-value"><strong>${fmtNumber(donor.meals)}</strong><span>meals</span></div>
      </div>`
    )
    .join("")}</div>`;
}

function recentRowsHTML(recent) {
  if (!recent.length) {
    return `<div class="empty-state empty-state--small">
      <div class="empty-icon">${icon("camera", 22)}</div>
      <h4>No delivery records yet</h4>
      <p>Confirmed handovers with their photo proof will be listed here.</p>
    </div>`;
  }
  return `<div class="recent-list">${recent
    .map(
      (item) => `<div class="recent-row">
        <div class="recent-icon">${icon(CATEGORY_ICONS[item.category] || "utensils", 16)}</div>
        <div class="recent-main">
          <strong>${esc(item.foodName)}</strong>
          <span>${esc(item.donor)} → ${esc(item.receiver)} · ${esc(fmtDate(item.deliveredAt))}</span>
        </div>
        <div class="recent-value">${fmtNumber(item.servings)} meals</div>
      </div>`
    )
    .join("")}</div>`;
}

function reportHTML(impact, ctx) {
  const isReceiver = ctx.user ? ctx.user.role === "receiver" : false;
  return `<div class="impact-hero">
      <span class="eyebrow eyebrow--light">SharePlate network · Hyderabad pilot</span>
      <h2>${fmtNumber(impact.meals)} meals have reached plates.</h2>
      <p>Every number below comes from a confirmed handover: a matched receiver, a 4-digit code, and a delivery photo on record. Updated ${esc(fmtDateTime(impact.generatedAt))}.</p>
      ${metricGridHTML(impact)}
    </div>

    <div class="chart-grid">
      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3>Meals rescued, last 14 days</h3>
            <p>Confirmed deliveries per day. Today's bar is highlighted.</p>
          </div>
          <span class="chart-legend-note">Daily meals</span>
        </div>
        ${barChart(impact.timeline)}
      </div>
      <div class="chart-card">
        <div class="chart-head">
          <div>
            <h3>By food category</h3>
            <p>Share of meals across confirmed handovers.</p>
          </div>
        </div>
        <div class="donut-wrap">
          ${donutChart(impact.byCategory)}
          ${legendHTML(impact.byCategory)}
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-col">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Top rescue partners</h3>
              <p>Ranked by confirmed meals shared through the network.</p>
            </div>
          </div>
          <div class="panel-body panel-body--flush">${donorRowsHTML(impact.topDonors)}</div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Recent confirmed handovers</h3>
              <p>The latest photo-verified deliveries across the network.</p>
            </div>
            ${
              ctx.user
                ? `<a class="panel-link" href="${isReceiver ? "#/board" : "#/requests"}">${isReceiver ? "Find food" : "View records"} ${icon("arrowRight", 13)}</a>`
                : ""
            }
          </div>
          <div class="panel-body panel-body--flush">${recentRowsHTML(impact.recent)}</div>
        </section>
      </div>

      <div class="dashboard-col">
        <div class="tip-card">
          <h3>How impact is measured</h3>
          <p>Only handovers confirmed by the receiver with the donor's code and a delivery photo are counted. Requests, listings and cancelled donations never inflate the total.</p>
          <ul class="tip-list">
            <li>${icon("utensils", 16)}Meals are the servings recorded on each confirmed donation.</li>
            <li>${icon("package", 16)}Weight is the donor's stated approximate weight, or 0.3 kg per serving when omitted.</li>
            <li>${icon("leaf", 16)}CO₂e avoided uses ${esc(impact.co2Factor)} kg per kg of rescued food.</li>
            <li>${icon("badgeCheck", 16)}Verified handovers are records the donor has also reviewed.</li>
          </ul>
        </div>

        <div class="safety-card">
          <h4>${icon("chart", 16)}Network snapshot</h4>
          <p>What is moving through SharePlate right now.</p>
          <div class="safety-list">
            <div class="safety-item">${icon("package", 14)}${fmtNumber(impact.availableMeals)} meals are available across ${fmtNumber(impact.availableDonations)} live listings.</div>
            <div class="safety-item">${icon("inbox", 14)}${fmtNumber(impact.openRequests)} requests are waiting for a donor decision.</div>
            <div class="safety-item">${icon("building", 14)}${fmtNumber(impact.donors)} donor organizations and ${fmtNumber(impact.receivers)} community receivers are registered.</div>
            <div class="safety-item">${icon("checkCircle", 14)}${fmtNumber(impact.deliveries)} deliveries are on record, ${fmtNumber(impact.verifiedDeliveries)} of them verified by the donor.</div>
          </div>
        </div>
      </div>
    </div>

    <p class="impact-note">CO₂e is an estimate for this prototype, using ${esc(impact.co2Factor)} kg CO₂e avoided per kilogram of food rescued. It is intended to show the direction of impact, not a formal life-cycle assessment.</p>`;
}

export async function renderImpact(ctx) {
  const response = await api.impact();
  const impact = response.impact;
  const isApp = Boolean(ctx.user);

  if (isApp) {
    const isReceiver = ctx.user.role === "receiver";
    return {
      docTitle: "Impact · SharePlate",
      title: "Impact",
      subtitle: "Confirmed handovers across the network",
      html: `<div class="page-head">
        <div>
          <h2>Impact report</h2>
          <p>Meals, weight and avoided emissions from confirmed, photo-verified handovers. The total moves only when a delivery is actually closed.</p>
        </div>
        <div class="page-head-actions">
          <a class="btn btn-soft" href="#/dashboard">${icon("grid", 15)}Dashboard</a>
          <a class="btn btn-accent" href="${isReceiver ? "#/board" : "#/give"}">${isReceiver ? icon("search", 16) + "Find food" : icon("plus", 16) + "Post surplus"}</a>
        </div>
      </div>
      ${reportHTML(impact, ctx)}`,
      mount() {},
    };
  }

  return {
    docTitle: "Impact · SharePlate",
    html: `${siteHeader(ctx)}
    <main id="view-root" class="landing">
      <section class="section">
        <div class="wrap">
          <div class="section-head">
            <div>
              <span class="eyebrow">Live impact report</span>
              <h2>Good food, measured by what reaches a plate.</h2>
            </div>
            <p>SharePlate counts a delivery only when the matched receiver enters the donor's handover code and uploads photo proof. This is the network's verified total.</p>
          </div>
          ${reportHTML(impact, ctx)}
          <div class="cta-band" style="margin-top:26px">
            <div>
              <span class="eyebrow eyebrow--light">Add to the total</span>
              <h2>One more handover changes the numbers.</h2>
              <p>Join as a restaurant, function hall or community kitchen and turn surplus into a confirmed delivery with proof.</p>
            </div>
            <div class="hero-actions">
              <a class="btn btn-accent btn-lg" href="#/register?role=restaurant">${icon("plus", 17)}Donate surplus</a>
              <a class="btn btn-light btn-lg" href="#/register?role=receiver">Join as a receiver</a>
            </div>
          </div>
        </div>
      </section>
    </main>
    ${siteFooter()}`,
    mount() {},
  };
}
