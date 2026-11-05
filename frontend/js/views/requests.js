import { api } from "../api.js";
import {
  bindCommonActions,
  deliveredCardHTML,
  handoverCardHTML,
  incomingRequestCardHTML,
} from "../components.js";
import {
  esc,
  fmtDateTime,
  fmtNumber,
  icon,
  statCardHTML,
  statusPill,
  timeAgo,
} from "../ui.js";

function closedRequestHTML(request, viewerRole) {
  const donation = request.donation;
  const other = viewerRole === "receiver" ? request.donor : request.receiver;
  return `<div class="request-card">
    <div class="request-main">
      <div class="request-top">
        <div>
          <div class="request-title">${esc(donation.foodName)} <span>· ${esc(other ? other.organization : "SharePlate")}</span></div>
          <div class="request-sub">${fmtNumber(donation.servings)} servings · ${esc(donation.area)} · ${esc(timeAgo(request.respondedAt || request.createdAt))}</div>
        </div>
        ${statusPill(request.status)}
      </div>
      <p class="request-quote">${esc(request.message)}</p>
      <div class="request-actions">
        <button type="button" class="btn btn-link" data-action="view-donation" data-id="${esc(donation.id)}">View listing</button>
      </div>
    </div>
  </div>`;
}

function waitingRequestHTML(request) {
  const donation = request.donation;
  return `<div class="request-card">
    <div class="request-main">
      <div class="request-top">
        <div>
          <div class="request-title">${esc(donation.foodName)} <span>· ${esc(request.donor ? request.donor.organization : "Donor")}</span></div>
          <div class="request-sub">Sent ${esc(timeAgo(request.createdAt))} · ${esc(donation.area)} · ${fmtNumber(donation.servings)} servings</div>
        </div>
        ${statusPill("pending")}
      </div>
      <p class="request-quote">${esc(request.message)}</p>
      <div class="request-meta">
        <span>${icon("clock", 12)}Safe until ${esc(fmtDateTime(donation.expiryTime))}</span>
        <span>${icon("mapPin", 12)}${esc(donation.area)}</span>
      </div>
      <div class="request-actions">
        <button type="button" class="btn btn-link" data-action="view-donation" data-id="${esc(donation.id)}">View listing</button>
        <span class="status-note">${icon("clock", 13)}Waiting for the donor to respond</span>
      </div>
    </div>
  </div>`;
}

function panel(title, description, body, { count = null, flush = false, link = "" } = {}) {
  return `<section class="panel">
    <div class="panel-head">
      <div>
        <h3>${esc(title)}${count === null ? "" : ` <span class="count-badge">${count}</span>`}</h3>
        <p>${esc(description)}</p>
      </div>
      ${link}
    </div>
    <div class="panel-body${flush ? " panel-body--flush" : ""}">${body}</div>
  </section>`;
}

function emptyPanel(iconName, title, body) {
  return `<div class="empty-state empty-state--small">
    <div class="empty-icon">${icon(iconName, 22)}</div>
    <h4>${esc(title)}</h4>
    <p>${esc(body)}</p>
  </div>`;
}

export async function renderRequests(ctx) {
  const response = await api.requests();
  const requests = response.requests || [];
  const isReceiver = ctx.user.role === "receiver";

  const pending = requests.filter((request) => request.status === "pending");
  const active = requests.filter(
    (request) =>
      request.status === "accepted" &&
      (request.donation.status === "accepted" || request.donation.status === "picked_up")
  );
  const delivered = requests.filter((request) => request.donation.status === "delivered");
  const closed = requests.filter(
    (request) => request.status === "declined" || request.donation.status === "cancelled"
  );
  const verified = delivered.filter((request) => request.donation.verifiedByDonor).length;

  const stats = isReceiver
    ? [
        statCardHTML({
          iconName: "clock",
          tone: "amber",
          trend: pending.length ? "awaiting donor" : "nothing pending",
          trendTone: pending.length ? "" : "muted",
          value: fmtNumber(pending.length),
          label: "Requests waiting",
        }),
        statCardHTML({
          iconName: "truck",
          tone: "coral",
          trend: active.length ? "action needed" : "all clear",
          trendTone: active.length ? "" : "muted",
          value: fmtNumber(active.length),
          label: "Handovers in progress",
        }),
        statCardHTML({
          iconName: "checkCircle",
          trend: delivered.length + " records",
          trendTone: "muted",
          value: fmtNumber(delivered.length),
          label: "Deliveries completed",
        }),
        statCardHTML({
          iconName: "badgeCheck",
          tone: "violet",
          trend: verified + " donor verified",
          trendTone: "muted",
          value: fmtNumber(verified),
          label: "Verified handovers",
        }),
      ]
    : [
        statCardHTML({
          iconName: "inbox",
          tone: "coral",
          trend: pending.length ? "needs a decision" : "all clear",
          trendTone: pending.length ? "" : "muted",
          value: fmtNumber(pending.length),
          label: "Requests to review",
        }),
        statCardHTML({
          iconName: "truck",
          tone: "amber",
          trend: active.length ? "code shared" : "none active",
          trendTone: active.length ? "" : "muted",
          value: fmtNumber(active.length),
          label: "Handovers in progress",
        }),
        statCardHTML({
          iconName: "checkCircle",
          trend: delivered.length + " records",
          trendTone: "muted",
          value: fmtNumber(delivered.length),
          label: "Deliveries completed",
        }),
        statCardHTML({
          iconName: "badgeCheck",
          tone: "violet",
          trend: verified + " of " + delivered.length,
          trendTone: "muted",
          value: fmtNumber(verified),
          label: "Verified by you",
        }),
      ];

  const primaryPanel = isReceiver
    ? panel(
        "Active handovers",
        "Enter the donor's 4-digit code with your delivery photo to close the loop.",
        active.length
          ? `<div class="delivery-stack">${active
              .map((request) => handoverCardHTML(request, "receiver"))
              .join("")}</div>`
          : emptyPanel(
              "truck",
              "No active handovers",
              "When a donor accepts one of your requests, the handover code and confirmation button appear here."
            ),
        { count: active.length }
      )
    : panel(
        "Requests awaiting your decision",
        "Accepting one request matches the donation and generates your handover code.",
        pending.length
          ? `<div class="request-list">${pending
              .map(incomingRequestCardHTML)
              .join("")}</div>`
          : emptyPanel(
              "inbox",
              "No requests waiting",
              "New requests from community kitchens land here. Post surplus to reach more receivers."
            ),
        { count: pending.length, flush: true }
      );

  const secondaryPanel = isReceiver
    ? panel(
        "Waiting on a donor",
        "Your request is with the donor. You will see the handover here once it is accepted.",
        pending.length
          ? `<div class="request-list">${pending.map(waitingRequestHTML).join("")}</div>`
          : emptyPanel(
              "search",
              "Nothing waiting",
              "Browse the live food board and request surplus you can collect within its safe window."
            ),
        { count: pending.length, flush: true }
      )
    : panel(
        "Handovers in progress",
        "Share the code at pickup. The receiver confirms with a photo before delivery is recorded.",
        active.length
          ? `<div class="delivery-stack">${active
              .map((request) => handoverCardHTML(request, "donor"))
              .join("")}</div>`
          : emptyPanel(
              "lock",
              "No handovers in progress",
              "Accept a pending request to generate a handover code and start a delivery."
            ),
        { count: active.length }
      );

  const deliveredPanel = panel(
    "Delivery records",
    isReceiver
      ? "Every confirmed handover keeps its photo proof and donor verification."
      : "Review the receiver's photo proof and verify the delivery to close the loop.",
    delivered.length
      ? `<div class="delivery-stack">${delivered
          .map((request) => deliveredCardHTML(request, isReceiver ? "receiver" : "donor"))
          .join("")}</div>`
      : emptyPanel(
          "camera",
          "No deliveries confirmed yet",
          "Once a receiver uploads proof, the delivery record and its photo appear here."
        ),
    { count: delivered.length }
  );

  const closedPanel = closed.length
    ? panel(
        "Declined & closed",
        "Requests that were declined or whose listing was withdrawn.",
        `<div class="request-list">${closed
          .map((request) => closedRequestHTML(request, isReceiver ? "receiver" : "donor"))
          .join("")}</div>`,
        { count: closed.length, flush: true }
      )
    : "";

  const tipCard = isReceiver
    ? `<div class="tip-card">
        <h3>Your handover checklist</h3>
        <p>The code proves the food reached the right receiver. The photo proves it was handed over safely.</p>
        <ul class="tip-list">
          <li>${icon("lock", 16)}Collect the 4-digit code from the donor at pickup.</li>
          <li>${icon("checkCircle", 16)}Check the food matches the listing and is still within its safe window.</li>
          <li>${icon("camera", 16)}Photograph the food you received before confirming.</li>
          <li>${icon("badgeCheck", 16)}The donor verifies the record after you submit.</li>
        </ul>
      </div>`
    : `<div class="tip-card">
        <h3>Close the loop</h3>
        <p>Accepting a request is only half the handover. The delivery is complete when the receiver's photo and code are on record.</p>
        <ul class="tip-list">
          <li>${icon("lock", 16)}Only share the handover code with the matched receiver.</li>
          <li>${icon("truck", 16)}The receiver marks the food collected when it changes hands.</li>
          <li>${icon("camera", 16)}Photo proof is required before the status becomes Delivered.</li>
          <li>${icon("badgeCheck", 16)}Verify the delivery once you review the proof.</li>
        </ul>
      </div>`;

  return {
    docTitle: (isReceiver ? "My requests" : "Requests & handovers") + " · SharePlate",
    title: isReceiver ? "My requests" : "Requests",
    subtitle: isReceiver
      ? ctx.user.organization + " · " + ctx.user.area
      : pending.length + " waiting · " + active.length + " in progress",
    html: `<div class="page-head">
      <div>
        <h2>${isReceiver ? "Your food requests" : "Requests & handovers"}</h2>
        <p>${
          isReceiver
            ? "Track every request from the moment you send it to the photo-proof delivery. Active handovers need the donor's code and your camera."
            : "Review incoming requests, share handover codes, and verify the photo proof that closes each delivery."
        }</p>
      </div>
      <div class="page-head-actions">
        <a class="btn btn-ghost" href="#/dashboard">${icon("grid", 15)}Dashboard</a>
        ${
          isReceiver
            ? `<a class="btn btn-accent" href="#/board">${icon("search", 16)}Find food</a>`
            : `<a class="btn btn-accent" href="#/give">${icon("plus", 16)}Post surplus</a>`
        }
      </div>
    </div>

    <div class="stats-grid">${stats.join("")}</div>

    <div class="dashboard-grid">
      <div class="dashboard-col">
        ${primaryPanel}
        ${deliveredPanel}
      </div>
      <div class="dashboard-col">
        ${secondaryPanel}
        ${closedPanel}
        ${tipCard}
      </div>
    </div>`,
    mount(root) {
      bindCommonActions(root, ctx);
    },
  };
}
