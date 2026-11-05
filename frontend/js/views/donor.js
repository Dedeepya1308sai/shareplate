import { api } from "../api.js";
import { state } from "../state.js";
import {
  bindCommonActions,
  detailsButton,
  donationCardHTML,
  handoverCardHTML,
  incomingRequestCardHTML,
  setupPhotoDropzone,
} from "../components.js";
import {
  areaOptionsHTML,
  categoryOptionsHTML,
  esc,
  fmtDate,
  fmtNumber,
  freshnessInfo,
  greeting,
  icon,
  setButtonBusy,
  statCardHTML,
  toISO,
  toLocalInput,
  toast,
} from "../ui.js";

const ACTIVE_STATUSES = ["available", "requested", "accepted", "picked_up"];

function listingFooter(donation) {
  const pending = donation.requestCount || 0;
  let note = "No requests yet";
  let iconName = "clock";
  if (donation.status === "requested") {
    note = pending + (pending === 1 ? " request waiting" : " requests waiting");
    iconName = "inbox";
  } else if (donation.status === "accepted") {
    note = "Matched · code ready";
    iconName = "lock";
  } else if (donation.status === "picked_up") {
    note = "Food collected · proof pending";
    iconName = "truck";
  }
  return `<span class="status-note">${icon(iconName, 13)}${esc(note)}</span>${detailsButton(donation.id, "Open")}`;
}

function recentDeliveryRow(request) {
  const donation = request.donation;
  return `<div class="recent-row">
    <div class="recent-icon">${icon(donation.verifiedByDonor ? "badgeCheck" : "checkCircle", 16)}</div>
    <div class="recent-main">
      <strong>${esc(donation.foodName)}</strong>
      <span>${esc(request.receiver ? request.receiver.organization : "Receiver")} · ${esc(fmtDate(donation.deliveredAt))}</span>
    </div>
    <div class="recent-value">${fmtNumber(donation.servings)} meals</div>
    <button type="button" class="btn btn-ghost btn-sm" data-action="view-donation" data-id="${esc(donation.id)}">${donation.verifiedByDonor ? "View record" : "Verify proof"}</button>
  </div>`;
}

export async function renderDonorDashboard(ctx) {
  const [mineResponse, requestsResponse] = await Promise.all([api.mine(), api.requests()]);
  const donations = mineResponse.donations || [];
  const requests = requestsResponse.requests || [];

  const active = donations.filter((donation) => ACTIVE_STATUSES.includes(donation.status));
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const handovers = requests.filter(
    (request) =>
      request.status === "accepted" &&
      (request.donation.status === "accepted" || request.donation.status === "picked_up")
  );
  const delivered = requests.filter((request) => request.donation.status === "delivered");
  const verified = delivered.filter((request) => request.donation.verifiedByDonor).length;
  const postedMeals = donations
    .filter((donation) => donation.status !== "cancelled")
    .reduce((sum, donation) => sum + Number(donation.servings || 0), 0);
  const deliveredMeals = delivered.reduce(
    (sum, request) => sum + Number(request.donation.servings || 0),
    0
  );

  const html = `<div class="page-head">
      <div>
        <h2>${esc(greeting())}, ${esc(ctx.user.organization)}.</h2>
        <p>Your surplus kitchen is connected to community kitchens across Hyderabad. Review requests, hand over safely, and close the loop with photo proof.</p>
      </div>
      <div class="page-head-actions">
        <a class="btn btn-soft" href="#/requests">${icon("inbox", 16)}Requests</a>
        <a class="btn btn-accent" href="#/give">${icon("plus", 16)}Post surplus</a>
      </div>
    </div>

    <div class="stats-grid">
      ${statCardHTML({
        iconName: "package",
        tone: "amber",
        trend: active.length ? "live now" : "none live",
        value: fmtNumber(active.length),
        label: "Live listings",
      })}
      ${statCardHTML({
        iconName: "utensils",
        trend: donations.length + " total listings",
        trendTone: "muted",
        value: fmtNumber(postedMeals),
        unit: "meals",
        label: "Meals posted for rescue",
      })}
      ${statCardHTML({
        iconName: "inbox",
        tone: "coral",
        trend: pendingRequests.length ? "needs a decision" : "all clear",
        trendTone: pendingRequests.length ? "" : "muted",
        value: fmtNumber(pendingRequests.length),
        label: "Pending requests",
      })}
      ${statCardHTML({
        iconName: "badgeCheck",
        tone: "violet",
        trend: delivered.length + " delivered",
        trendTone: "muted",
        value: fmtNumber(verified),
        label: "Verified handovers",
      })}
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-col">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Live listings <span class="count-badge">${active.length}</span></h3>
              <p>Everything currently visible on the SharePlate board.</p>
            </div>
            <a class="panel-link" href="#/give">New listing ${icon("plus", 13)}</a>
          </div>
          <div class="panel-body">
            ${
              active.length
                ? `<div class="donation-grid">${active
                    .slice(0, 6)
                    .map((donation) =>
                      donationCardHTML(donation, {
                        footer: listingFooter(donation),
                      })
                    )
                    .join("")}</div>`
                : `<div class="empty-state"><div class="empty-icon">${icon("package", 24)}</div><h4>No live listings</h4><p>Post tonight's surplus and let nearby kitchens request what they can collect.</p><button type="button" class="btn btn-soft btn-sm" data-nav="/give">Post surplus</button></div>`
            }
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Recent deliveries</h3>
              <p>Photo proof and verification live with each record.</p>
            </div>
            <a class="panel-link" href="#/requests">All requests ${icon("arrowRight", 13)}</a>
          </div>
          <div class="panel-body panel-body--flush">
            ${
              delivered.length
                ? `<div class="recent-list">${delivered.slice(0, 5).map(recentDeliveryRow).join("")}</div>`
                : `<div class="empty-state empty-state--small"><div class="empty-icon">${icon("camera", 22)}</div><h4>No confirmed deliveries yet</h4><p>Once a receiver uploads proof, the record appears here for your verification.</p></div>`
            }
          </div>
        </section>
      </div>

      <div class="dashboard-col">
        <section class="panel">
          <div class="panel-head">
            <div>
              <h3>Requests to review <span class="count-badge">${pendingRequests.length}</span></h3>
              <p>Accepting one matches the donation and generates your handover code.</p>
            </div>
          </div>
          <div class="panel-body panel-body--flush">
            ${
              pendingRequests.length
                ? `<div class="request-list">${pendingRequests
                    .slice(0, 5)
                    .map(incomingRequestCardHTML)
                    .join("")}</div>`
                : `<div class="empty-state empty-state--small"><div class="empty-icon">${icon("inbox", 22)}</div><h4>No requests waiting</h4><p>When a community kitchen asks for your surplus, it lands here instantly.</p></div>`
            }
          </div>
        </section>

        ${
          handovers.length
            ? `<section class="panel">
                <div class="panel-head">
                  <div>
                    <h3>Handovers in progress <span class="count-badge">${handovers.length}</span></h3>
                    <p>Share the code. The receiver confirms with a photo.</p>
                  </div>
                </div>
                <div class="panel-body">
                  <div class="delivery-stack">${handovers
                    .map((request) => handoverCardHTML(request, "donor"))
                    .join("")}</div>
                </div>
              </section>`
            : `<div class="tip-card">
                <h3>Ready before pickup</h3>
                <p>Pack the food in clean, covered containers and keep hot food hot. The receiver brings the code and a camera — you bring the handover.</p>
                <ul class="tip-list">
                  <li>${icon("shield", 16)}Only share the handover code with the matched receiver.</li>
                  <li>${icon("camera", 16)}Photo proof is required before the status becomes Delivered.</li>
                  <li>${icon("badgeCheck", 16)}Verify the delivery once you review the receiver's photo.</li>
                </ul>
              </div>`
        }

        <div class="safety-card">
          <h4>${icon("leaf", 16)}This month at a glance</h4>
          <p>${fmtNumber(deliveredMeals)} meals have been confirmed through your kitchen across ${delivered.length} handovers.</p>
          <div class="safety-list">
            <div class="safety-item">${icon("checkCircle", 14)}${fmtNumber(postedMeals - deliveredMeals > 0 ? postedMeals - deliveredMeals : 0)} meals are still in the pipeline across live listings.</div>
            <div class="safety-item">${icon("badgeCheck", 14)}${fmtNumber(verified)} of ${fmtNumber(delivered.length)} delivery records carry your verification.</div>
          </div>
        </div>
      </div>
    </div>`;

  return {
    docTitle: "Overview · SharePlate",
    title: "Overview",
    subtitle: ctx.user.organization + " · " + ctx.user.area,
    html,
    mount(root) {
      bindCommonActions(root, ctx);
    },
  };
}

function defaultTimes() {
  const prep = new Date(Date.now() - 45 * 60 * 1000);
  const expiry = new Date(Date.now() + 4 * 60 * 60 * 1000);
  return { prep: toLocalInput(prep), expiry: toLocalInput(expiry) };
}

export function renderGive(ctx) {
  const times = defaultTimes();
  const areas = state.areas;

  return {
    docTitle: "Post surplus · SharePlate",
    title: "Post surplus food",
    subtitle: "Publish surplus in under a minute",
    html: `<div class="page-head">
      <div>
        <h2>Post surplus food</h2>
        <p>Add the details a receiver needs to decide quickly: what it is, how much, when it was prepared, and how long it stays safe.</p>
      </div>
      <div class="page-head-actions">
        <a class="btn btn-ghost" href="#/dashboard">${icon("arrowLeft", 15)}Back to dashboard</a>
      </div>
    </div>
    <form id="donation-form" novalidate>
      <div class="form-layout">
        <div class="form-card">
          <div class="form-error" data-form-error role="alert"></div>
          <div class="form-section-title" style="margin-top:16px">What are you sharing?</div>
          <div class="form-grid">
            <div class="field">
              <span class="field-label">Food photo <span class="optional">optional · recommended</span></span>
              <div class="dropzone" id="photo-drop" tabindex="0" role="button" aria-label="Add a photo of the food">
                <input type="file" id="photo-input" name="photo" accept="image/jpeg,image/png,image/webp" aria-label="Food photo">
                <div data-dropzone-empty>
                  <span class="drop-icon">${icon("image", 22)}</span>
                  <strong>Add a photo of the food</strong>
                  <small>Drag and drop or click to browse. JPG, PNG or WebP, up to 5 MB. Photos help receivers recognize the meal.</small>
                </div>
                <img data-preview alt="" hidden>
                <div class="preview-actions" data-preview-actions hidden>
                  <button type="button" data-remove-photo>Remove</button>
                </div>
                <div class="preview-caption" data-preview-caption hidden></div>
              </div>
            </div>
            <label class="field" for="food-name">
              <span class="field-label">Food name</span>
              <input class="input" id="food-name" name="foodName" type="text" placeholder="e.g. Vegetable biryani with raita" minlength="3" maxlength="80" required>
            </label>
            <div class="field-row">
              <label class="field" for="food-category">
                <span class="field-label">Category</span>
                <select class="select" id="food-category" name="category" required>
                  ${categoryOptionsHTML("cooked")}
                </select>
              </label>
              <label class="field" for="food-servings">
                <span class="field-label">Servings</span>
                <input class="input" id="food-servings" name="servings" type="number" min="1" max="1000" step="1" value="30" required>
              </label>
            </div>
            <label class="field" for="food-weight">
              <span class="field-label">Approximate weight <span class="optional">optional</span></span>
              <input class="input" id="food-weight" name="weightKg" type="number" min="0.1" max="1000" step="0.1" placeholder="e.g. 8">
              <span class="hint">In kilograms. If left blank we estimate roughly 0.3 kg per serving.</span>
            </label>
          </div>

          <div class="form-section-title" style="margin-top:24px">Timing and safety</div>
          <div class="form-grid">
            <div class="field-row">
              <label class="field" for="prep-time">
                <span class="field-label">Preparation time</span>
                <input class="input" id="prep-time" name="prepTime" type="datetime-local" value="${times.prep}" required>
              </label>
              <label class="field" for="expiry-time">
                <span class="field-label">Safe until</span>
                <input class="input" id="expiry-time" name="expiryTime" type="datetime-local" value="${times.expiry}" required>
              </label>
            </div>
            <div class="handover-hint" data-freshness-preview>
              ${icon("clock", 16)}<span>Choose a safe-until time at least 15 minutes from now. The board shows receivers a live freshness bar.</span>
            </div>
          </div>

          <div class="form-section-title" style="margin-top:24px">Pickup details</div>
          <div class="form-grid">
            <div class="field-row">
              <label class="field" for="pickup-area">
                <span class="field-label">Pickup area</span>
                <select class="select" id="pickup-area" name="area" required>
                  <option value="">Choose an area</option>
                  ${areaOptionsHTML(areas, ctx.user.area)}
                </select>
              </label>
              <label class="field" for="pickup-address">
                <span class="field-label">Pickup address</span>
                <input class="input" id="pickup-address" name="pickupAddress" type="text" value="${esc(ctx.user.address || "")}" placeholder="Building, street, landmark" minlength="5" maxlength="160" required>
              </label>
            </div>
            <label class="field" for="donation-notes">
              <span class="field-label">Notes for the receiver <span class="optional">optional</span></span>
              <textarea class="textarea" id="donation-notes" name="notes" rows="3" maxlength="500" placeholder="e.g. Contains dairy. Bring two insulated carriers. Ask for the kitchen manager at the service entrance."></textarea>
            </label>
          </div>

          <div class="form-actions" style="margin-top:24px">
            <button type="submit" class="btn btn-accent btn-lg">${icon("send", 16)}Publish surplus</button>
            <span class="hint">Visible to community kitchens across Hyderabad.</span>
          </div>
        </div>

        <aside>
          <div class="tip-card">
            <h3>Make the match easy</h3>
            <p>A clear listing gets collected faster. Receivers decide with four things: distance, quantity, safe window and what the food actually is.</p>
            <ul class="tip-list">
              <li>${icon("camera", 16)}A real photo of the food, not the menu.</li>
              <li>${icon("clock", 16)}An honest safe-until time. When in doubt, choose earlier.</li>
              <li>${icon("package", 16)}Mention packaging and whether carriers are needed.</li>
              <li>${icon("mapPin", 16)}Use the exact pickup area so distance matching stays accurate.</li>
            </ul>
          </div>
          <div class="safety-card">
            <h4>${icon("shield", 16)}Food-safety first</h4>
            <p>Share only food you would serve your own guests.</p>
            <div class="safety-list">
              <div class="safety-item">${icon("check", 14)}Keep hot food above 60°C and cold food below 5°C.</div>
              <div class="safety-item">${icon("check", 14)}Do not share food that has already been out for hours.</div>
              <div class="safety-item">${icon("check", 14)}Label allergens when you know them.</div>
              <div class="safety-item">${icon("check", 14)}Pack in clean, covered containers.</div>
            </div>
          </div>
        </aside>
      </div>
    </form>`,
    mount(root) {
      setupGiveForm(root, ctx);
    },
  };
}

function setupGiveForm(root, ctx) {
  const form = root.querySelector("#donation-form");
  const errorBox = root.querySelector("[data-form-error]");
  const submit = form.querySelector('button[type="submit"]');
  const photo = setupPhotoDropzone(root.querySelector("#photo-drop"));
  const prepInput = form.querySelector("#prep-time");
  const expiryInput = form.querySelector("#expiry-time");
  const preview = root.querySelector("[data-freshness-preview]");

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.add("is-visible");
    errorBox.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function updateFreshness() {
    const prep = toISO(prepInput.value);
    const expiry = toISO(expiryInput.value);
    if (!prep || !expiry) {
      preview.innerHTML = `${icon("clock", 16)}<span>Choose a preparation time and a safe-until time.</span>`;
      preview.style.background = "";
      return;
    }
    const info = freshnessInfo({ prepTime: prep, expiryTime: expiry });
    const tone = info.tone === "expired" ? "Safe window already ended." : info.text;
    preview.innerHTML = `${icon("clock", 16)}<span>Freshness window: <strong>${esc(tone)}</strong>. Receivers see this live on the board.</span>`;
  }

  prepInput.addEventListener("change", updateFreshness);
  expiryInput.addEventListener("change", updateFreshness);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.remove("is-visible");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const prep = toISO(prepInput.value);
    const expiry = toISO(expiryInput.value);
    if (!prep || !expiry) {
      showError("Enter a valid preparation time and safe-until time.");
      return;
    }
    const now = Date.now();
    if (new Date(prep).getTime() > now + 30 * 60 * 1000) {
      showError("Preparation time cannot be more than 30 minutes in the future.");
      return;
    }
    if (new Date(expiry).getTime() <= new Date(prep).getTime()) {
      showError("Safe-until time must be after the preparation time.");
      return;
    }
    if (new Date(expiry).getTime() < now + 15 * 60 * 1000) {
      showError("Choose a safe-until time at least 15 minutes from now.");
      return;
    }

    const data = new FormData();
    const file = photo.getFile();
    if (file) data.append("photo", file);
    data.append("foodName", form.querySelector("#food-name").value.trim());
    data.append("category", form.querySelector("#food-category").value);
    data.append("servings", form.querySelector("#food-servings").value);
    data.append("weightKg", form.querySelector("#food-weight").value);
    data.append("prepTime", prep);
    data.append("expiryTime", expiry);
    data.append("area", form.querySelector("#pickup-area").value);
    data.append("pickupAddress", form.querySelector("#pickup-address").value.trim());
    data.append("notes", form.querySelector("#donation-notes").value.trim());

    setButtonBusy(submit, true);
    try {
      const response = await api.createDonation(data);
      const donation = response.donation;
      toast(
        `${fmtNumber(donation.servings)} servings of ${donation.foodName} are now live on the board.`,
        { type: "success", title: "Surplus published" }
      );
      ctx.navigate("/dashboard");
    } catch (error) {
      setButtonBusy(submit, false);
      showError(error.message);
    }
  });
}
