import { api } from "./api.js";
import {
  avatarHTML,
  CATEGORY_ICONS,
  categoryLabel,
  closeModal,
  confirmDialog,
  copyText,
  esc,
  fmtDate,
  fmtDateTime,
  fmtKg,
  fmtNumber,
  fmtTime,
  freshnessHTML,
  icon,
  openModal,
  optimizeImage,
  setButtonBusy,
  statusMeta,
  statusPill,
  timeAgo,
  toast,
  validateImageFile,
} from "./ui.js";

export function mediaHTML(donation, { showStatus = true } = {}) {
  const hasImage = Boolean(donation.imageUrl);
  return `<div class="donation-media">
    ${hasImage ? `<img src="${esc(donation.imageUrl)}" alt="${esc(donation.foodName)}" loading="lazy">` : ""}
    <div class="media-placeholder" aria-hidden="true">${icon(CATEGORY_ICONS[donation.category] || "package", 40)}</div>
    <div class="media-top">
      ${showStatus ? statusPill(donation.status, donation) : ""}
      ${donation.distanceKm !== null && donation.distanceKm !== undefined ? `<span class="media-score">${icon("mapPin", 11)}${esc(donation.distanceKm)} km</span>` : ""}
    </div>
    <div class="media-bottom">
      <span class="media-category">${esc(categoryLabel(donation.category))}</span>
      <span class="media-distance">${icon("mapPin", 11)} ${esc(donation.area)}</span>
    </div>
  </div>`;
}

export function metaChipsHTML(donation) {
  return `<div class="meta-row">
    <span class="meta-chip">${icon("users", 12)}${fmtNumber(donation.servings)} servings</span>
    <span class="meta-chip">${icon("package", 12)}${esc(fmtKg(donation.weightKg))}</span>
    <span class="meta-chip">${icon("clock", 12)}Ready ${esc(fmtTimeOfDay(donation.prepTime))}</span>
  </div>`;
}

function fmtTimeOfDay(iso) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(
    new Date(iso)
  );
}

export function donationCardHTML(donation, { footer = "", showStatus = true } = {}) {
  const donorName = donation.donor ? donation.donor.organization : "Donor";
  return `<article class="donation-card" data-donation-id="${esc(donation.id)}">
    ${mediaHTML(donation, { showStatus })}
    <div class="donation-body">
      <div class="donation-donor">${icon("building", 13)}<span>${esc(donorName)} · ${esc(donation.area)}</span></div>
      <h3 class="donation-title">${esc(donation.foodName)}</h3>
      ${metaChipsHTML(donation)}
      <div class="donation-location">${icon("mapPin", 13)}<span>${esc(donation.pickupAddress)}</span></div>
      ${freshnessHTML(donation)}
    </div>
    <div class="donation-foot">${footer}</div>
  </article>`;
}

export function detailsButton(donationId, label = "View details") {
  return `<button type="button" class="btn btn-soft btn-sm" data-action="view-donation" data-id="${esc(donationId)}">${icon("file", 15)}${esc(label)}</button>`;
}

export function miniTimelineHTML(status) {
  const rank = {
    available: 1,
    requested: 1,
    accepted: 2,
    picked_up: 3,
    delivered: 4,
    cancelled: 0,
  }[status] || 0;
  const steps = ["Listed", "Matched", "Collected", "Delivered"];
  return `<div class="mini-timeline" aria-label="Delivery progress: ${esc(status.replace("_", " "))}">
    ${steps
      .map((label, index) => {
        const stepRank = index + 1;
        const done = rank >= stepRank;
        const current = rank === stepRank;
        const line =
          index < steps.length - 1
            ? `<span class="mini-line ${rank > stepRank ? "is-done" : ""}"></span>`
            : "";
        return `<span class="mini-step ${done ? "is-done" : ""} ${current ? "is-current" : ""}">
          <span class="mini-dot">${icon(done ? "check" : "clock", 9)}</span>
          <span>${label}</span>
        </span>${line}`;
      })
      .join("")}
  </div>`;
}

export function timelineHTML(donation) {
  const accepted = Boolean(donation.acceptedAt);
  const collected = Boolean(donation.pickedUpAt);
  const delivered = Boolean(donation.deliveredAt);
  const receiver = donation.acceptedReceiver ? donation.acceptedReceiver.organization : "";

  const step = (title, description, done, current, iconName) => `<div class="timeline-step ${done ? "is-done" : ""} ${current ? "is-current" : ""}">
    <span class="timeline-dot">${icon(done ? "check" : iconName, 12)}</span>
    <div class="timeline-content"><strong>${esc(title)}</strong><span>${esc(description)}</span></div>
  </div>`;

  const rows = [
    step(
      "Surplus posted",
      `${donation.donor ? donation.donor.organization : "Donor"} · ${fmtDateTime(donation.createdAt)}`,
      true,
      !accepted && !delivered,
      "package"
    ),
    step(
      "Matched with receiver",
      accepted && receiver
        ? `${receiver} · ${fmtDateTime(donation.acceptedAt)}`
        : "Waiting for the donor to accept a request.",
      accepted,
      accepted && !collected && !delivered,
      "badgeCheck"
    ),
    step(
      "Food collected",
      collected ? `Handover started · ${fmtDateTime(donation.pickedUpAt)}` : "Mark collected when the food changes hands.",
      collected,
      collected && !delivered,
      "truck"
    ),
    step(
      "Delivery confirmed",
      delivered
        ? `Photo proof uploaded · ${fmtDateTime(donation.deliveredAt)}`
        : "Receiver confirms with the handover code and a photo.",
      delivered,
      false,
      "camera"
    ),
  ];

  return `<div class="timeline">${rows.join("")}</div>`;
}

export function codePanelHTML(code, { hint = "Share this code with the receiver at pickup." } = {}) {
  return `<div class="code-panel">
    <div>
      <span class="code-label">Handover code</span>
      <span class="code-value">${esc(code || "••••")}</span>
    </div>
    <button type="button" class="icon-btn" data-copy-code="${esc(code || "")}" aria-label="Copy handover code" title="Copy code">${icon("copy", 15)}</button>
    <span class="code-hint">${esc(hint)}</span>
  </div>`;
}

export function bindCopyButtons(root) {
  root.querySelectorAll("[data-copy-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      const copied = await copyText(button.getAttribute("data-copy-code") || "");
      toast(copied ? "Handover code copied." : "Could not copy automatically. Please read the code aloud.", {
        type: copied ? "success" : "info",
      });
    });
  });
}

export function contactHTML(person, role) {
  if (!person) return "";
  const label = role === "receiver" ? "Receiver contact" : "Donor contact";
  return `<div class="contact-card">
    ${avatarHTML(person.organization || person.name)}
    <div class="contact-card-info">
      <strong>${esc(person.organization || person.name)}</strong>
      <span>${esc(person.name)}${person.area ? " · " + esc(person.area) : ""}</span>
    </div>
    <div class="contact-links">
      ${person.phone ? `<a href="tel:${esc(person.phone.replace(/[^\d+]/g, ""))}">${icon("phone", 12)}Call</a>` : ""}
      ${person.email ? `<a href="mailto:${esc(person.email)}">${icon("mail", 12)}Email</a>` : ""}
    </div>
  </div>`;
}

function proofHTML(donation) {
  if (!donation.proofImageUrl) return "";
  return `<div class="detail-section">
    <h3>Delivery proof</h3>
    <div class="proof-frame"><img src="${esc(donation.proofImageUrl)}" alt="Delivery confirmation photo for ${esc(donation.foodName)}" loading="lazy"></div>
    <div class="proof-meta">
      ${statusPill("delivered")}
      <span>Confirmed ${esc(fmtDateTime(donation.deliveredAt))}</span>
      ${donation.verifiedByDonor ? `<span class="badge">${icon("badgeCheck", 12)}Donor verified ${esc(fmtDate(donation.verifiedAt))}</span>` : `<span class="badge">${icon("clock", 12)}Awaiting donor verification</span>`}
    </div>
    ${donation.deliveryNotes ? `<div class="detail-notes" style="margin-top:10px">${esc(donation.deliveryNotes)}</div>` : ""}
  </div>`;
}

function requestsSection(donation) {
  if (!donation.requests || !donation.requests.length) return "";
  return `<div class="detail-section">
    <h3>Requests (${donation.requests.length})</h3>
    <div class="requests-mini">
      ${donation.requests
        .map(
          (request) => `<div class="request-card">
            <div class="request-main">
              <div class="request-top">
                <div>
                  <div class="request-title">${esc(request.receiver ? request.receiver.organization : "Receiver")}</div>
                  <div class="request-sub">${esc(request.receiver ? request.receiver.name : "")} · ${esc(timeAgo(request.createdAt))}</div>
                </div>
                ${statusPill(request.status)}
              </div>
              <p class="request-quote">${esc(request.message)}</p>
              ${
                request.receiver && request.receiver.phone
                  ? `<div class="request-meta"><span>${icon("phone", 12)}${esc(request.receiver.phone)}</span><span>${icon("mail", 12)}${esc(request.receiver.email)}</span></div>`
                  : ""
              }
            </div>
          </div>`
        )
        .join("")}
    </div>
  </div>`;
}

function modalActionsHTML(donation, user) {
  const actions = [];
  if (donation.isOwner && donation.canVerify) {
    actions.push(
      `<button type="button" class="btn btn-primary" data-verify-donation>${icon("badgeCheck", 16)}Verify delivery</button>`
    );
  }
  if (donation.isOwner && donation.canCancel) {
    actions.push(
      `<button type="button" class="btn btn-danger" data-cancel-donation>${icon("close", 15)}Cancel listing</button>`
    );
  }
  if (donation.isOwner && donation.requests && donation.requests.some((request) => request.status === "pending")) {
    actions.push(
      `<button type="button" class="btn btn-soft" data-nav="/requests">${icon("inbox", 15)}Manage requests</button>`
    );
  }
  if (user.role === "receiver" && donation.canRequest) {
    actions.push(
      `<button type="button" class="btn btn-primary" data-request-donation>${icon("send", 15)}Request this food</button>`
    );
  }
  actions.push(
    `<button type="button" class="btn btn-ghost" data-close-modal>${icon("close", 15)}Close</button>`
  );
  return actions.join("");
}

export async function openDonationModal(donationId, ctx) {
  openModal(
    `<div class="modal-body"><div class="empty-state empty-state--small"><span class="spinner" style="color:var(--forest-700)"></span><p>Loading donation…</p></div></div>`,
    { wide: true }
  );
  try {
    const { donation } = await api.donation(donationId);
    renderDonationModal(donation, ctx);
  } catch (error) {
    openModal(
      `<div class="modal-head"><div><h2 id="modal-title">Could not load donation</h2><p>${esc(error.message)}</p></div><button type="button" class="icon-btn modal-close" data-close-modal aria-label="Close">${icon("close", 16)}</button></div><div class="modal-foot"><button type="button" class="btn btn-primary" data-close-modal>Close</button></div>`
    );
  }
}

function renderDonationModal(donation, ctx) {
  const { user, refresh, onRequest } = ctx;
  const receiverContact =
    donation.isOwner && donation.acceptedReceiver ? donation.acceptedReceiver : null;
  const donorContact =
    !donation.isOwner && donation.donor && donation.acceptedAt ? donation.donor : null;

  const codeSection =
    donation.isOwner && donation.handoverCode && ["accepted", "picked_up", "delivered"].includes(donation.status)
      ? `<div class="detail-section"><h3>Handover</h3>${codePanelHTML(donation.handoverCode, { hint: "The receiver types this code when confirming delivery." })}</div>`
      : "";

  const receiverCodeHint =
    !donation.isOwner && donation.hasHandoverCode && !donation.deliveredAt
      ? `<div class="detail-section"><h3>Handover</h3><div class="handover-hint">${icon("lock", 16)}<span>Your donor will share a 4-digit handover code at pickup. You will enter it with your delivery photo to confirm the handover.</span></div></div>`
      : "";

  const markup = `<div class="modal-head">
      <div>
        <h2 id="modal-title">${esc(donation.foodName)}</h2>
        <p>${esc(donation.id)} · ${esc(donation.isOwner ? "Your listing" : donation.donor ? donation.donor.organization : "SharePlate network")}</p>
      </div>
      <button type="button" class="icon-btn modal-close" data-close-modal aria-label="Close">${icon("close", 16)}</button>
    </div>
    <div class="modal-body">
      <div class="modal-media">
        ${donation.imageUrl ? `<img src="${esc(donation.imageUrl)}" alt="${esc(donation.foodName)}">` : `<div class="media-placeholder">${icon(CATEGORY_ICONS[donation.category] || "package", 44)}</div>`}
        <div class="media-top">${statusPill(donation.status, donation)}${donation.distanceKm !== null && donation.distanceKm !== undefined ? `<span class="media-score">${icon("mapPin", 11)}${esc(donation.distanceKm)} km</span>` : ""}</div>
      </div>
      <div class="detail-title-row">
        <div class="detail-donor">${icon("building", 14)} ${esc(donation.donor ? donation.donor.organization : "Donor")} · ${esc(donation.area)}</div>
        <span class="badge">${esc(categoryLabel(donation.category))}</span>
      </div>
      <div class="detail-facts">
        <div class="detail-fact"><span>Servings</span><strong>${fmtNumber(donation.servings)} meals</strong></div>
        <div class="detail-fact"><span>Approx. weight</span><strong>${esc(fmtKg(donation.weightKg))}</strong></div>
        <div class="detail-fact"><span>Safe until</span><strong>${esc(fmtDateTime(donation.expiryTime))}</strong></div>
        <div class="detail-fact"><span>Prepared</span><strong>${esc(fmtDateTime(donation.prepTime))}</strong></div>
        <div class="detail-fact"><span>Pickup area</span><strong>${esc(donation.area)}</strong></div>
        <div class="detail-fact"><span>Request status</span><strong>${donation.myRequest ? esc(statusMeta(donation.myRequest.status).label) : donation.isOwner ? esc(pluralRequests(donation.requests)) : "Not requested yet"}</strong></div>
      </div>
      <div class="detail-section"><h3>Pickup address</h3><div class="detail-notes">${esc(donation.pickupAddress)}</div></div>
      ${donation.notes ? `<div class="detail-section"><h3>Donor notes</h3><div class="detail-notes">${esc(donation.notes)}</div></div>` : ""}
      ${receiverContact ? `<div class="detail-section"><h3>Receiver contact</h3>${contactHTML(receiverContact, "receiver")}</div>` : ""}
      ${donorContact ? `<div class="detail-section"><h3>Donor contact</h3>${contactHTML(donorContact, "donor")}</div>` : ""}
      ${codeSection}
      ${receiverCodeHint}
      <div class="detail-section"><h3>Journey</h3>${timelineHTML(donation)}</div>
      ${donation.requests ? requestsSection(donation) : ""}
      ${proofHTML(donation)}
    </div>
    <div class="modal-foot">
      <span class="hint">${donation.isOwner ? "Only your listings show request contacts and handover codes." : "Photo proof is visible once your delivery is confirmed."}</span>
      ${modalActionsHTML(donation, user)}
    </div>`;

  openModal(markup, {
    wide: true,
    onMount(root) {
      bindCopyButtons(root);

      const requestButton = root.querySelector("[data-request-donation]");
      if (requestButton) {
        requestButton.addEventListener("click", () => {
          closeModal();
          if (onRequest) onRequest(donation);
        });
      }

      const verifyButton = root.querySelector("[data-verify-donation]");
      if (verifyButton) {
        verifyButton.addEventListener("click", async () => {
          const confirmed = await confirmDialog({
            title: "Verify this delivery?",
            message:
              "The photo proof and handover code are on record. Verifying tells the receiver and SharePlate that the food reached its intended destination.",
            confirmLabel: "Yes, verify delivery",
          });
          if (!confirmed) return;
          setButtonBusy(verifyButton, true);
          try {
            await api.verifyDelivery(donation.id);
            closeModal();
            toast("Delivery verified. Thank you for closing the loop.", { type: "success" });
            if (refresh) await refresh();
          } catch (error) {
            setButtonBusy(verifyButton, false);
            toast(error.message, { type: "error" });
          }
        });
      }

      const cancelButton = root.querySelector("[data-cancel-donation]");
      if (cancelButton) {
        cancelButton.addEventListener("click", async () => {
          const confirmed = await confirmDialog({
            title: "Cancel this listing?",
            message:
              "The donation will be withdrawn from the board and any pending requests will be declined. This cannot be undone.",
            confirmLabel: "Cancel listing",
            cancelLabel: "Keep listing",
            tone: "danger",
          });
          if (!confirmed) return;
          try {
            await api.cancelDonation(donation.id);
            closeModal();
            toast("Listing cancelled.", { type: "info" });
            if (refresh) await refresh();
          } catch (error) {
            toast(error.message, { type: "error" });
          }
        });
      }
    },
  });
}

function pluralRequests(requests) {
  const count = requests ? requests.length : 0;
  return count === 0 ? "No requests yet" : count + (count === 1 ? " request" : " requests");
}

function requestMediaHTML(donation) {
  return `<div class="request-media">
    ${
      donation.imageUrl
        ? `<img src="${esc(donation.imageUrl)}" alt="${esc(donation.foodName)}" loading="lazy">`
        : `<div class="media-placeholder">${icon(CATEGORY_ICONS[donation.category] || "package", 20)}</div>`
    }
  </div>`;
}

export function incomingRequestCardHTML(request) {
  const donation = request.donation;
  const receiver = request.receiver;
  const distance =
    donation.distanceKm !== null && donation.distanceKm !== undefined
      ? ` · ${donation.distanceKm} km`
      : "";
  return `<div class="request-card">
    ${requestMediaHTML(donation)}
    <div class="request-main">
      <div class="request-top">
        <div>
          <div class="request-title">${esc(receiver ? receiver.organization : "Receiver")} <span>wants</span> ${esc(donation.foodName)}</div>
          <div class="request-sub">${esc(receiver ? receiver.name : "")} · ${esc(timeAgo(request.createdAt))}</div>
        </div>
        ${statusPill("pending")}
      </div>
      <p class="request-quote">${esc(request.message)}</p>
      <div class="request-meta">
        <span>${icon("users", 12)}${fmtNumber(donation.servings)} servings</span>
        <span>${icon("mapPin", 12)}${esc(donation.area)}${esc(distance)}</span>
        <span>${icon("clock", 12)}safe until ${esc(fmtTime(donation.expiryTime))}</span>
      </div>
      ${
        receiver && (receiver.phone || receiver.email)
          ? `<div class="request-meta"><span>${icon("phone", 12)}${esc(receiver.phone || "")}</span><span>${icon("mail", 12)}${esc(receiver.email || "")}</span></div>`
          : ""
      }
      <div class="request-actions">
        <button type="button" class="btn btn-primary btn-sm" data-accept-request data-donation-id="${esc(donation.id)}" data-request-id="${esc(request.id)}">${icon("check", 14)}Accept</button>
        <button type="button" class="btn btn-ghost btn-sm" data-decline-request data-donation-id="${esc(donation.id)}" data-request-id="${esc(request.id)}">Decline</button>
        <button type="button" class="btn btn-link" data-action="view-donation" data-id="${esc(donation.id)}">View listing</button>
      </div>
    </div>
  </div>`;
}

export function handoverCardHTML(request, viewerRole) {
  const donation = request.donation;
  const isReceiver = viewerRole === "receiver";
  const other = isReceiver ? request.donor : request.receiver;
  const handover = isReceiver
    ? `<div class="handover-hint">${icon("lock", 16)}<span>Enter the 4-digit code from ${
        request.donor ? esc(request.donor.organization) : "the donor"
      } together with your delivery photo to close this handover.</span></div>`
    : donation.handoverCode
      ? codePanelHTML(donation.handoverCode, {
          hint: "Share this code with the receiver at pickup.",
        })
      : "";
  return `<div class="delivery-card">
    <div class="delivery-top">
      ${requestMediaHTML(donation)}
      <div class="delivery-info">
        <h4>${esc(donation.foodName)}</h4>
        <p>${esc(donation.id)} · ${esc(other ? other.organization : "")} · ${esc(donation.area)}</p>
      </div>
      ${statusPill(donation.status)}
    </div>
    ${miniTimelineHTML(donation.status)}
    ${handover}
    ${other ? contactHTML(other, isReceiver ? "donor" : "receiver") : ""}
    <div class="request-actions">
      <button type="button" class="btn btn-soft btn-sm" data-action="view-donation" data-id="${esc(donation.id)}">${icon("file", 14)}Details</button>
      ${
        isReceiver && donation.canMarkCollected
          ? `<button type="button" class="btn btn-ghost btn-sm" data-mark-collected data-id="${esc(donation.id)}">${icon("truck", 14)}Mark collected</button>`
          : ""
      }
      ${
        isReceiver && donation.canConfirm
          ? `<button type="button" class="btn btn-accent btn-sm" data-confirm-delivery data-id="${esc(donation.id)}">${icon("camera", 14)}Confirm delivery</button>`
          : ""
      }
    </div>
  </div>`;
}

export function deliveredCardHTML(request, viewerRole) {
  const donation = request.donation;
  const isReceiver = viewerRole === "receiver";
  const other = isReceiver ? request.donor : request.receiver;
  const verifyButton = donation.canVerify
    ? `<button type="button" class="btn btn-primary btn-sm" data-verify-delivery data-id="${esc(donation.id)}">${icon("badgeCheck", 14)}Verify delivery</button>`
    : "";
  return `<div class="delivery-card">
    <div class="delivery-top">
      ${requestMediaHTML(donation)}
      <div class="delivery-info">
        <h4>${esc(donation.foodName)}</h4>
        <p>${esc(donation.id)} · ${esc(other ? other.organization : "")} · ${esc(donation.area)}</p>
      </div>
      ${statusPill("delivered")}
    </div>
    ${
      donation.proofImageUrl
        ? `<div class="proof-frame"><img src="${esc(donation.proofImageUrl)}" alt="Delivery confirmation photo for ${esc(donation.foodName)}" loading="lazy"></div>`
        : ""
    }
    <div class="proof-meta">
      <span>${icon("checkCircle", 13)}Confirmed ${esc(fmtDateTime(donation.deliveredAt))}</span>
      ${
        donation.verifiedByDonor
          ? `<span class="badge">${icon("badgeCheck", 12)}Donor verified</span>`
          : `<span class="badge">${icon("clock", 12)}Awaiting donor verification</span>`
      }
    </div>
    <div class="request-actions">
      <button type="button" class="btn btn-soft btn-sm" data-action="view-donation" data-id="${esc(donation.id)}">${icon("file", 14)}Delivery record</button>
      ${verifyButton}
    </div>
  </div>`;
}

export function setupPhotoDropzone(drop) {
  if (!drop) return { getFile: () => null, reset: () => {} };
  const input = drop.querySelector('input[type="file"]');
  const empty = drop.querySelector("[data-dropzone-empty]");
  const image = drop.querySelector("[data-preview]");
  const actions = drop.querySelector("[data-preview-actions]");
  const caption = drop.querySelector("[data-preview-caption]");
  let currentFile = null;

  function reset() {
    currentFile = null;
    if (input) input.value = "";
    drop.classList.remove("has-image");
    if (empty) empty.hidden = false;
    if (image) {
      image.hidden = true;
      image.removeAttribute("src");
    }
    if (actions) actions.hidden = true;
    if (caption) caption.hidden = true;
  }

  async function accept(file) {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      toast(problem, { type: "error" });
      if (input) input.value = "";
      return;
    }
    if (caption) {
      caption.hidden = false;
      caption.textContent = "Preparing photo…";
    }
    try {
      const result = await optimizeImage(file);
      currentFile = result.file;
      if (image) {
        image.src = result.preview;
        image.alt = "Selected photo";
        image.hidden = false;
      }
      if (empty) empty.hidden = true;
      drop.classList.add("has-image");
      if (actions) actions.hidden = false;
      if (caption) {
        caption.hidden = false;
        caption.textContent =
          result.file.name + " · " + Math.max(1, Math.round(result.file.size / 1024)) + " KB";
      }
    } catch (error) {
      toast(error.message, { type: "error" });
      reset();
    }
  }

  if (input) {
    input.addEventListener("change", () => accept(input.files && input.files[0]));
  }
  drop.addEventListener("dragover", (event) => {
    event.preventDefault();
    drop.classList.add("is-dragging");
  });
  drop.addEventListener("dragleave", () => drop.classList.remove("is-dragging"));
  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    drop.classList.remove("is-dragging");
    const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
    if (file) accept(file);
  });
  const removeButton = drop.querySelector("[data-remove-photo]");
  if (removeButton) {
    removeButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      reset();
    });
  }
  drop.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && event.target === drop) {
      event.preventDefault();
      if (input) input.click();
    }
  });

  return { getFile: () => currentFile, reset };
}

export function openRequestModal(donation, ctx) {
  const donorName = donation.donor ? donation.donor.organization : "the donor";
  const suggested = `Hi ${donorName}, we can collect ${donation.servings} servings of ${donation.foodName} from ${donation.area}. Please share the best pickup window.`;
  openModal(
    `<form id="request-form" novalidate>
      <div class="modal-head">
        <div>
          <h2 id="modal-title">Request this food</h2>
          <p>${esc(donation.foodName)} · ${esc(donation.id)}</p>
        </div>
        <button type="button" class="icon-btn modal-close" data-close-modal aria-label="Close">${icon("close", 16)}</button>
      </div>
      <div class="modal-body">
        <div class="detail-facts">
          <div class="detail-fact"><span>Donor</span><strong>${esc(donorName)}</strong></div>
          <div class="detail-fact"><span>Servings</span><strong>${fmtNumber(donation.servings)} meals</strong></div>
          <div class="detail-fact"><span>Pickup area</span><strong>${esc(donation.area)}</strong></div>
          <div class="detail-fact"><span>Safe until</span><strong>${esc(fmtTime(donation.expiryTime))}</strong></div>
          <div class="detail-fact"><span>Category</span><strong>${esc(categoryLabel(donation.category))}</strong></div>
          <div class="detail-fact"><span>Distance</span><strong>${donation.distanceKm !== null && donation.distanceKm !== undefined ? esc(donation.distanceKm) + " km" : "—"}</strong></div>
        </div>
        <div class="form-error" data-form-error role="alert"></div>
        <label class="field" for="request-message">
          <span class="field-label">Message to the donor</span>
          <textarea class="textarea" id="request-message" name="message" rows="4" maxlength="300" required>${esc(suggested)}</textarea>
          <span class="hint">Share who you are, how you will collect, and any timing constraints.</span>
        </label>
        <div class="handover-hint" style="margin-top:16px">${icon("info", 16)}<span>If the donor accepts, you will receive a 4-digit handover code at pickup. You need that code and a delivery photo to mark the food delivered.</span></div>
      </div>
      <div class="modal-foot">
        <button type="button" class="btn btn-ghost" data-close-modal>Cancel</button>
        <button type="submit" class="btn btn-primary">${icon("send", 15)}Send request</button>
      </div>
    </form>`,
    {
      onMount(root) {
        const form = root.querySelector("#request-form");
        const errorBox = root.querySelector("[data-form-error]");
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const message = form.message.value.trim();
          if (message.length < 5) {
            errorBox.textContent = "Write a short message (at least 5 characters).";
            errorBox.classList.add("is-visible");
            return;
          }
          const button = form.querySelector('button[type="submit"]');
          errorBox.classList.remove("is-visible");
          setButtonBusy(button, true);
          try {
            await api.requestFood(donation.id, message);
            closeModal();
            toast("Request sent. The donor will review it shortly.", { type: "success" });
            if (ctx.refresh) await ctx.refresh();
          } catch (error) {
            setButtonBusy(button, false);
            errorBox.textContent = error.message;
            errorBox.classList.add("is-visible");
          }
        });
      },
    }
  );
}

export function bindCommonActions(root, ctx) {
  root.addEventListener("click", async (event) => {
    const viewButton = event.target.closest('[data-action="view-donation"]');
    if (viewButton) {
      event.preventDefault();
      if (ctx.openDonation) ctx.openDonation(viewButton.getAttribute("data-id"));
      return;
    }

    const acceptButton = event.target.closest("[data-accept-request]");
    if (acceptButton) {
      const confirmed = await confirmDialog({
        title: "Accept this request?",
        message:
          "The receiver will be matched to this donation and other pending requests will be declined. A 4-digit handover code is generated for you to share at pickup.",
        confirmLabel: "Accept & match",
      });
      if (!confirmed) return;
      setButtonBusy(acceptButton, true);
      try {
        await api.acceptRequest(
          acceptButton.getAttribute("data-donation-id"),
          acceptButton.getAttribute("data-request-id")
        );
        toast("Request accepted. Your handover code is ready.", { type: "success" });
        if (ctx.refresh) await ctx.refresh();
      } catch (error) {
        setButtonBusy(acceptButton, false);
        toast(error.message, { type: "error" });
      }
      return;
    }

    const declineButton = event.target.closest("[data-decline-request]");
    if (declineButton) {
      const confirmed = await confirmDialog({
        title: "Decline this request?",
        message:
          "The receiver will be told that this donation is not available for them. You can still accept another request or keep the listing open.",
        confirmLabel: "Decline request",
        cancelLabel: "Keep request",
        tone: "danger",
      });
      if (!confirmed) return;
      setButtonBusy(declineButton, true);
      try {
        await api.declineRequest(
          declineButton.getAttribute("data-donation-id"),
          declineButton.getAttribute("data-request-id")
        );
        toast("Request declined.", { type: "info" });
        if (ctx.refresh) await ctx.refresh();
      } catch (error) {
        setButtonBusy(declineButton, false);
        toast(error.message, { type: "error" });
      }
      return;
    }

    const collectedButton = event.target.closest("[data-mark-collected]");
    if (collectedButton) {
      const confirmed = await confirmDialog({
        title: "Mark the food as collected?",
        message:
          "Use this when the food has physically changed hands. Next, upload a photo and the handover code to confirm delivery.",
        confirmLabel: "Mark collected",
      });
      if (!confirmed) return;
      setButtonBusy(collectedButton, true);
      try {
        await api.markCollected(collectedButton.getAttribute("data-id"));
        toast("Marked as collected. Add your photo proof to finish.", { type: "success" });
        if (ctx.refresh) await ctx.refresh();
      } catch (error) {
        setButtonBusy(collectedButton, false);
        toast(error.message, { type: "error" });
      }
      return;
    }

    const confirmButton = event.target.closest("[data-confirm-delivery]");
    if (confirmButton) {
      event.preventDefault();
      if (ctx.navigate) ctx.navigate("/confirm/" + confirmButton.getAttribute("data-id"));
      return;
    }

    const verifyButton = event.target.closest("[data-verify-delivery]");
    if (verifyButton) {
      const confirmed = await confirmDialog({
        title: "Verify this delivery?",
        message:
          "The receiver's photo proof and handover code are on record. Verifying confirms the food reached its intended destination.",
        confirmLabel: "Yes, verify delivery",
      });
      if (!confirmed) return;
      setButtonBusy(verifyButton, true);
      try {
        await api.verifyDelivery(verifyButton.getAttribute("data-id"));
        toast("Delivery verified. Thank you for closing the loop.", { type: "success" });
        if (ctx.refresh) await ctx.refresh();
      } catch (error) {
        setButtonBusy(verifyButton, false);
        toast(error.message, { type: "error" });
      }
    }
  });
}
