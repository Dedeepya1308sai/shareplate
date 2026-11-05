import { api } from "../api.js";
import {
  bindCommonActions,
  contactHTML,
  detailsButton,
  donationCardHTML,
  handoverCardHTML,
  setupPhotoDropzone,
} from "../components.js";
import {
  categoryLabel,
  debounce,
  esc,
  fmtDate,
  fmtDateTime,
  fmtKg,
  fmtNumber,
  fmtTime,
  greeting,
  icon,
  setButtonBusy,
  statCardHTML,
  statusMeta,
  statusPill,
  timeAgo,
  toast,
} from "../ui.js";

function requestButton(donation) {
  if (donation.role === "receiver" && donation.canRequest) {
    return `<button type="button" class="btn btn-accent btn-sm" data-request-food data-id="${esc(donation.id)}">${icon("send", 14)}Request</button>`;
  }
  if (donation.myRequest) {
    return `<span class="status-note">${icon("checkCircle", 13)}${esc(statusMeta(donation.myRequest.status).label)}</span>`;
  }
  return "";
}

function boardFooter(donation, role) {
  return `${role === "receiver" ? requestButton(donation) : ""}${detailsButton(donation.id, "Details")}`;
}

function deliveredRow(request) {
  const donation = request.donation;
  return `<div class="recent-row">
    <div class="recent-icon">${icon("camera", 16)}</div>
    <div class="recent-main">
      <strong>${esc(donation.foodName)}</strong>
      <span>${esc(request.donor ? request.donor.organization : "Donor")} · ${esc(fmtDate(donation.deliveredAt))}</span>
    </div>
    <div class="recent-value">${fmtNumber(donation.servings)} meals</div>
    <button type="button" class="btn btn-ghost btn-sm" data-action="view-donation" data-id="${esc(donation.id)}">View proof</button>
  </div>`;
}

export async function renderReceiverDashboard(ctx) {
  const [boardResponse, requestsResponse] = await Promise.all([
    api.board({ sort: "distance" }),
    api.requests(),
  ]);
  const board = boardResponse.donations || [];
  const requests = requestsResponse.requests || [];

  const pending = requests.filter((request) => request.status === "pending");
  const active = requests.filter(
    (request) =>
      request.status === "accepted" &&
      (request.donation.status === "accepted" || request.donation.status === "picked_up")
  );
  const delivered = requests.filter((request) => request.donation.status === "delivered");
  const verified = delivered.filter((request) => request.donation.verifiedByDonor).length;
  const mealsAvailable = board.reduce((sum, donation) => sum + Number(donation.servings || 0), 0);

  return {
    docTitle: "Overview · SharePlate",
    title: "Overview",
    subtitle: ctx.user.organization + " · " + ctx.user.area,
    html: `<div class="page-head">
        <div>
          <h2>${esc(greeting())}, ${esc(ctx.user.organization)}.</h2>
          <p>Here is the safest surplus closest to ${esc(ctx.user.area)}. Request what you can collect, then close the handover with a photo.</p>
        </div>
        <div class="page-head-actions">
          <a class="btn btn-soft" href="#/requests">${icon("inbox", 16)}My requests</a>
          <a class="btn btn-accent" href="#/board">${icon("search", 16)}Find food</a>
        </div>
      </div>

      <div class="stats-grid">
        ${statCardHTML({
          iconName: "mapPin",
          tone: "amber",
          trend: "Hyderabad",
          trendTone: "muted",
          value: fmtNumber(board.length),
          label: "Live donations near you",
        })}
        ${statCardHTML({
          iconName: "utensils",
          trend: "ready to request",
          trendTone: "muted",
          value: fmtNumber(mealsAvailable),
          unit: "meals",
          label: "Food available nearby",
        })}
        ${statCardHTML({
          iconName: "truck",
          tone: "coral",
          trend: pending.length + " pending",
          trendTone: "muted",
          value: fmtNumber(active.length),
          label: "Handovers in progress",
        })}
        ${statCardHTML({
          iconName: "badgeCheck",
          tone: "violet",
          trend: verified + " donor verified",
          trendTone: "muted",
          value: fmtNumber(delivered.length),
          label: "Deliveries completed",
        })}
      </div>

      <div class="dashboard-grid">
        <div class="dashboard-col">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h3>Available near you <span class="count-badge">${board.length}</span></h3>
                <p>Closest first, based on your area — ${esc(ctx.user.area)}.</p>
              </div>
              <a class="panel-link" href="#/board">Browse all ${icon("arrowRight", 13)}</a>
            </div>
            <div class="panel-body">
              ${
                board.length
                  ? `<div class="donation-grid">${board
                      .slice(0, 3)
                      .map((donation) =>
                        donationCardHTML(donation, {
                          footer: boardFooter({ ...donation, role: "receiver" }, "receiver"),
                        })
                      )
                      .join("")}</div>`
                  : `<div class="empty-state"><div class="empty-icon">${icon("leaf", 24)}</div><h4>No surplus listed right now</h4><p>New donations appear here the moment a kitchen posts them. Check back shortly.</p><button type="button" class="btn btn-soft btn-sm" data-nav="/board">Refresh board</button></div>`
              }
            </div>
          </section>

          <section class="panel">
            <div class="panel-head">
              <div>
                <h3>Recently completed</h3>
                <p>Your photo proof is stored with every delivery.</p>
              </div>
              <a class="panel-link" href="#/requests">All requests ${icon("arrowRight", 13)}</a>
            </div>
            <div class="panel-body panel-body--flush">
              ${
                delivered.length
                  ? `<div class="recent-list">${delivered.slice(0, 4).map(deliveredRow).join("")}</div>`
                  : `<div class="empty-state empty-state--small"><div class="empty-icon">${icon("camera", 22)}</div><h4>No deliveries confirmed yet</h4><p>After your first handover, the photo proof and donor verification appear here.</p></div>`
              }
            </div>
          </section>
        </div>

        <div class="dashboard-col">
          <section class="panel">
            <div class="panel-head">
              <div>
                <h3>Active handovers <span class="count-badge">${active.length}</span></h3>
                <p>Enter the donor's code with a photo to confirm delivery.</p>
              </div>
            </div>
            <div class="panel-body">
              ${
                active.length
                  ? `<div class="delivery-stack">${active
                      .map((request) => handoverCardHTML(request, "receiver"))
                      .join("")}</div>`
                  : `<div class="empty-state empty-state--small"><div class="empty-icon">${icon("truck", 22)}</div><h4>Nothing in transit</h4><p>When a donor accepts your request, the handover and its confirm button appear here.</p></div>`
              }
            </div>
          </section>

          ${
            pending.length
              ? `<section class="panel">
                  <div class="panel-head">
                    <div>
                      <h3>Waiting on a donor <span class="count-badge">${pending.length}</span></h3>
                      <p>You will be notified when they respond.</p>
                    </div>
                  </div>
                  <div class="panel-body panel-body--flush">
                    <div class="request-list">${pending
                      .slice(0, 3)
                      .map(
                        (request) => `<div class="request-card">
                          <div class="request-main">
                            <div class="request-top">
                              <div>
                                <div class="request-title">${esc(request.donation.foodName)} <span>· ${esc(request.donor ? request.donor.organization : "Donor")}</span></div>
                                <div class="request-sub">${esc(donationMeta(request))} · ${esc(timeAgo(request.createdAt))}</div>
                              </div>
                              ${statusPill("pending")}
                            </div>
                            <p class="request-quote">${esc(request.message)}</p>
                            <div class="request-actions">
                              <button type="button" class="btn btn-link" data-action="view-donation" data-id="${esc(request.donation.id)}">View listing</button>
                            </div>
                          </div>
                        </div>`
                      )
                      .join("")}</div>
                  </div>
                </section>`
              : ""
          }

          <div class="tip-card">
            <h3>At the handover</h3>
            <p>The code and the photo are what turn a good intention into a verified delivery.</p>
            <ul class="tip-list">
              <li>${icon("lock", 16)}Ask the donor for the 4-digit code at pickup.</li>
              <li>${icon("checkCircle", 16)}Check the food matches the listing and is still safe.</li>
              <li>${icon("camera", 16)}Photograph the packed food or the handover itself.</li>
              <li>${icon("badgeCheck", 16)}Submit the code, checklist and photo to mark Delivered.</li>
            </ul>
          </div>
        </div>
      </div>`,
    mount(root) {
      bindCommonActions(root, ctx);
    },
  };
}

function donationMeta(request) {
  const donation = request.donation;
  const distance =
    donation.distanceKm !== null && donation.distanceKm !== undefined
      ? " · " + donation.distanceKm + " km"
      : "";
  return `${fmtNumber(donation.servings)} servings · ${donation.area}${distance}`;
}

function categoryChipsHTML(donations) {
  const categories = ["all", "cooked", "bakery", "produce", "packaged", "dairy", "other"];
  return categories
    .map((category) => {
      const count =
        category === "all"
          ? donations.length
          : donations.filter((donation) => donation.category === category).length;
      return `<button type="button" class="filter-chip ${category === "all" ? "is-active" : ""}" data-category="${category}">
        ${category === "all" ? "All food" : esc(categoryLabel(category))} <span class="filter-count">${count}</span>
      </button>`;
    })
    .join("");
}

export async function renderBoard(ctx) {
  const response = await api.board({ sort: "distance" });
  const donations = response.donations || [];
  const role = ctx.user.role;

  return {
    docTitle: "Food nearby · SharePlate",
    title: role === "receiver" ? "Food nearby" : "Live food board",
    subtitle: "Safe surplus, sorted by distance",
    html: `<div class="page-head">
        <div>
          <h2>${role === "receiver" ? "Food available nearby" : "Live food board"}</h2>
          <p>${
            role === "receiver"
              ? `Live surplus from kitchens across Hyderabad, closest to ${esc(ctx.user.area)} first. Request what you can collect within its safe window.`
              : "A live look at surplus moving through the network. Receivers request food directly from this board."
          }</p>
        </div>
        <div class="page-head-actions">
          <a class="btn btn-soft" href="#/requests">${icon("inbox", 16)}${role === "receiver" ? "My requests" : "Requests"}</a>
        </div>
      </div>
      <div class="board-toolbar">
        <div class="search-field">
          ${icon("search", 16)}
          <input class="input" id="board-search" type="search" placeholder="Search food, donor or area" aria-label="Search donations">
        </div>
        <select class="select sort-field" id="board-sort" aria-label="Sort donations">
          <option value="distance">Closest first</option>
          <option value="expiry">Expiring soon</option>
        </select>
      </div>
      <div class="filter-row" id="board-filters">${categoryChipsHTML(donations)}</div>
      <div class="board-summary">
        <span>Showing <strong data-board-count>${donations.length}</strong> live donations</span>
        <span id="board-sort-note">Closest to ${esc(ctx.user.area)} first</span>
      </div>
      <div id="board-grid"></div>`,
    mount(root) {
      setupBoard(root, ctx, donations, role);
    },
  };
}

function setupBoard(root, ctx, donations, role) {
  const grid = root.querySelector("#board-grid");
  const search = root.querySelector("#board-search");
  const sortSelect = root.querySelector("#board-sort");
  const filters = root.querySelector("#board-filters");
  const count = root.querySelector("[data-board-count]");
  const sortNote = root.querySelector("#board-sort-note");
  const byId = new Map(donations.map((donation) => [donation.id, donation]));

  let category = "all";
  let sort = "distance";
  let query = "";

  function render() {
    const term = query.trim().toLowerCase();
    let visible = donations.filter((donation) => {
      if (category !== "all" && donation.category !== category) return false;
      if (!term) return true;
      const donor = donation.donor ? donation.donor.organization.toLowerCase() : "";
      return (
        donation.foodName.toLowerCase().includes(term) ||
        donation.id.toLowerCase().includes(term) ||
        donation.area.toLowerCase().includes(term) ||
        donor.includes(term)
      );
    });

    if (sort === "distance") {
      visible.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
      sortNote.textContent = "Closest to " + ctx.user.area + " first";
    } else {
      visible.sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime));
      sortNote.textContent = "Expiring soonest first";
    }

    count.textContent = String(visible.length);

    if (!visible.length) {
      grid.innerHTML = `<div class="panel"><div class="empty-state">
        <div class="empty-icon">${icon("search", 24)}</div>
        <h4>No food matches this search</h4>
        <p>Try a different area, category or donor name. New surplus is posted throughout the day.</p>
        <button type="button" class="btn btn-soft btn-sm" data-reset-filters>Reset filters</button>
      </div></div>`;
      return;
    }

    grid.innerHTML = `<div class="donation-grid">${visible
      .map((donation) =>
        donationCardHTML(
          { ...donation, role },
          { footer: boardFooter({ ...donation, role }, role) }
        )
      )
      .join("")}</div>`;
  }

  search.addEventListener(
    "input",
    debounce(() => {
      query = search.value;
      render();
    }, 160)
  );

  sortSelect.addEventListener("change", () => {
    sort = sortSelect.value;
    render();
  });

  filters.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-category]");
    if (!chip) return;
    category = chip.getAttribute("data-category");
    filters.querySelectorAll("[data-category]").forEach((entry) => {
      entry.classList.toggle("is-active", entry === chip);
    });
    render();
  });

  root.addEventListener("click", (event) => {
    if (event.target.closest("[data-reset-filters]")) {
      query = "";
      category = "all";
      sort = "distance";
      search.value = "";
      sortSelect.value = "distance";
      filters.querySelectorAll("[data-category]").forEach((entry) => {
        entry.classList.toggle("is-active", entry.getAttribute("data-category") === "all");
      });
      render();
      return;
    }
    const request = event.target.closest("[data-request-food]");
    if (request && role === "receiver") {
      const donation = byId.get(request.getAttribute("data-id"));
      if (donation) ctx.requestFood(donation);
    }
  });

  bindCommonActions(root, ctx);
  render();
}

export async function renderConfirm(ctx, params) {
  const id = params.id;
  let donation;
  try {
    const response = await api.donation(id);
    donation = response.donation;
  } catch (error) {
    return {
      docTitle: "Delivery not found · SharePlate",
      title: "Confirm delivery",
      subtitle: "This handover is not available",
      html: `<section class="panel"><div class="empty-state">
          <div class="empty-icon">${icon("alert", 24)}</div>
          <h4>We could not open this handover</h4>
          <p>${esc(error.message)}</p>
          <button type="button" class="btn btn-soft btn-sm" data-nav="/requests">Back to my requests</button>
        </div></section>`,
      mount() {},
    };
  }

  if (donation.status === "delivered") {
    return {
      docTitle: "Delivery confirmed · SharePlate",
      title: "Delivery confirmed",
      subtitle: donation.id + " · " + donation.foodName,
      html: `<div class="page-head">
          <div>
            <h2>Delivery confirmed.</h2>
            <p>${esc(donation.foodName)} from ${esc(donation.donor ? donation.donor.organization : "the donor")} is now recorded as delivered with photo proof.</p>
          </div>
        </div>
        <section class="panel">
          <div class="panel-body">
            <div class="success-panel">
              <div class="success-mark">${icon("badgeCheck", 32)}</div>
              <h2>${donation.verifiedByDonor ? "Verified by the donor." : "Proof received."}</h2>
              <p>${
                donation.verifiedByDonor
                  ? "The donor has reviewed your photo and verified the delivery. This handover now counts toward the verified impact total."
                  : "The donor can now see your confirmation photo and verify the delivery. You can revisit this record from your requests."
              }</p>
              ${
                donation.proofImageUrl
                  ? `<div class="success-proof"><img src="${esc(donation.proofImageUrl)}" alt="Delivery confirmation photo for ${esc(donation.foodName)}"></div>`
                  : ""
              }
              <div class="proof-meta" style="justify-content:center;margin-top:14px">
                ${statusPill("delivered")}
                <span>${icon("clock", 13)}${esc(fmtDateTime(donation.deliveredAt))}</span>
                ${
                  donation.verifiedByDonor
                    ? `<span class="badge">${icon("badgeCheck", 12)}Donor verified</span>`
                    : `<span class="badge">${icon("clock", 12)}Awaiting donor verification</span>`
                }
              </div>
              <div class="success-actions">
                <a class="btn btn-primary" href="#/requests">Back to my requests</a>
                <a class="btn btn-soft" href="#/board">Find more food</a>
              </div>
            </div>
          </div>
        </section>`,
      mount() {},
    };
  }

  if (!donation.canConfirm) {
    return {
      docTitle: "Confirm delivery · SharePlate",
      title: "Confirm delivery",
      subtitle: "This handover is not ready",
      html: `<section class="panel"><div class="empty-state">
          <div class="empty-icon">${icon("lock", 24)}</div>
          <h4>This handover is not ready for confirmation</h4>
          <p>Only the matched receiver can confirm a delivery, and only after the donor has accepted the request.</p>
          <button type="button" class="btn btn-soft btn-sm" data-nav="/requests">Back to my requests</button>
        </div></section>`,
      mount() {},
    };
  }

  const donor = donation.donor;
  return {
    docTitle: "Confirm delivery · SharePlate",
    title: "Confirm delivery",
    subtitle: donation.id + " · " + donation.foodName,
    html: `<div class="page-head">
        <div>
          <h2>Confirm the handover</h2>
          <p>Enter the donor's 4-digit code and upload one photo of the food you received. The delivery becomes Delivered only when both are received.</p>
        </div>
        <div class="page-head-actions">
          <a class="btn btn-ghost" href="#/requests">${icon("arrowLeft", 15)}My requests</a>
        </div>
      </div>
      <form id="confirm-form" novalidate>
        <div class="form-layout">
          <div class="form-card">
            <div class="form-error" data-form-error role="alert"></div>
            <div class="form-section-title" style="margin-top:16px">Handover details</div>
            <div class="form-grid">
              <div class="detail-facts" style="margin:0">
                <div class="detail-fact"><span>Food</span><strong>${esc(donation.foodName)}</strong></div>
                <div class="detail-fact"><span>Servings</span><strong>${fmtNumber(donation.servings)} meals</strong></div>
                <div class="detail-fact"><span>Pickup area</span><strong>${esc(donation.area)}</strong></div>
                <div class="detail-fact"><span>Donor</span><strong>${esc(donor ? donor.organization : "Donor")}</strong></div>
                <div class="detail-fact"><span>Safe until</span><strong>${esc(fmtTime(donation.expiryTime))}</strong></div>
                <div class="detail-fact"><span>Status</span><strong>${esc(statusMeta(donation.status).label)}</strong></div>
              </div>
              ${donor ? contactHTML(donor, "donor") : ""}
              <div class="handover-hint">${icon("lock", 16)}<span>Ask ${esc(donor ? donor.organization : "the donor")} for the 4-digit handover code. It is only shared with you after they accept your request.</span></div>
              <label class="field" for="handover-code">
                <span class="field-label">Handover code</span>
                <input class="input" id="handover-code" name="handoverCode" type="text" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="one-time-code" placeholder="4 digits" required style="letter-spacing:0.4em;font-size:22px;max-width:180px">
              </label>
            </div>

            <div class="form-section-title" style="margin-top:24px">Photo proof of delivery</div>
            <div class="form-grid">
              <div class="field">
                <span class="field-label">Confirmation photo <span class="optional">required</span></span>
                <div class="dropzone" id="proof-drop" tabindex="0" role="button" aria-label="Upload delivery confirmation photo">
                  <input type="file" id="proof-input" name="proof" accept="image/jpeg,image/png,image/webp" aria-label="Delivery photo" required>
                  <div data-dropzone-empty>
                    <span class="drop-icon">${icon("camera", 22)}</span>
                    <strong>Upload a delivery photo</strong>
                    <small>Photograph the food you received, ideally with its packaging. JPG, PNG or WebP, up to 5 MB.</small>
                  </div>
                  <img data-preview alt="" hidden>
                  <div class="preview-actions" data-preview-actions hidden>
                    <button type="button" data-remove-photo>Remove</button>
                  </div>
                  <div class="preview-caption" data-preview-caption hidden></div>
                </div>
              </div>
              <label class="field" for="delivery-notes">
                <span class="field-label">Delivery notes <span class="optional">optional</span></span>
                <textarea class="textarea" id="delivery-notes" name="deliveryNotes" rows="3" maxlength="300" placeholder="e.g. 28 meals collected at 8:10 pm. Everything was still warm and packed in sealed trays."></textarea>
              </label>
              <label class="check-row" for="safety-check">
                <input type="checkbox" id="safety-check" name="checklist">
                <span><strong>I confirm the food-safety checklist</strong> The food was still within its safe window, packed hygienically, and handed over as described in the listing.</span>
              </label>
            </div>

            <div class="form-actions" style="margin-top:24px">
              <button type="submit" class="btn btn-accent btn-lg">${icon("badgeCheck", 16)}Confirm delivery</button>
              ${
                donation.canMarkCollected
                  ? `<button type="button" class="btn btn-ghost" data-mark-collected data-id="${esc(donation.id)}">${icon("truck", 15)}Mark collected first</button>`
                  : ""
              }
              <span class="hint">The donor can verify this record after you submit.</span>
            </div>
          </div>

          <aside>
            <div class="tip-card">
              <h3>Why the code matters</h3>
              <p>The code confirms this food went to the intended receiver, not just to anyone. The photo proves the handover happened.</p>
              <ul class="tip-list">
                <li>${icon("lock", 16)}Never share the code with someone who is not collecting the food.</li>
                <li>${icon("camera", 16)}Use a recent, real photo — not a stock image.</li>
                <li>${icon("checkCircle", 16)}Check the food before you accept the handover.</li>
                <li>${icon("badgeCheck", 16)}Both the code and photo are stored with the donation record.</li>
              </ul>
            </div>
            <div class="safety-card">
              <h4>${icon("shield", 16)}Pickup summary</h4>
              <p>${esc(donation.pickupAddress)}</p>
              <div class="safety-list">
                <div class="safety-item">${icon("package", 14)}${fmtNumber(donation.servings)} servings · ${esc(fmtKg(donation.weightKg))}</div>
                <div class="safety-item">${icon("clock", 14)}Safe until ${esc(fmtDateTime(donation.expiryTime))}</div>
                ${donation.notes ? `<div class="safety-item">${icon("file", 14)}${esc(donation.notes)}</div>` : ""}
              </div>
            </div>
          </aside>
        </div>
      </form>`,
    mount(root) {
      setupConfirmForm(root, ctx, donation);
    },
  };
}

function setupConfirmForm(root, ctx, donation) {
  const form = root.querySelector("#confirm-form");
  const errorBox = root.querySelector("[data-form-error]");
  const submit = form.querySelector('button[type="submit"]');
  const photo = setupPhotoDropzone(root.querySelector("#proof-drop"));

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add("is-visible");
    errorBox.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  form.querySelector("#handover-code").addEventListener("input", (event) => {
    event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.remove("is-visible");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const code = form.querySelector("#handover-code").value.trim();
    if (!/^\d{4}$/.test(code)) {
      showError("Enter the 4-digit handover code from the donor.");
      return;
    }
    const checklist = form.querySelector("#safety-check").checked;
    if (!checklist) {
      showError("Please confirm the food-safety checklist before completing delivery.");
      return;
    }
    const file = photo.getFile();
    if (!file) {
      showError("Attach a delivery photo as proof of handover.");
      return;
    }

    const data = new FormData();
    data.append("handoverCode", code);
    data.append("checklist", "true");
    data.append("deliveryNotes", form.querySelector("#delivery-notes").value.trim());
    data.append("proof", file);

    setButtonBusy(submit, true);
    try {
      await api.confirmDelivery(donation.id, data);
      toast("Delivery confirmed with photo proof.", {
        type: "success",
        title: "Handover closed",
      });
      await ctx.refresh();
    } catch (error) {
      setButtonBusy(submit, false);
      showError(error.message);
    }
  });

  bindCommonActions(root, ctx);
}
