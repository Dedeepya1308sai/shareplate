"use strict";

const express = require("express");
const crypto = require("crypto");
const store = require("../lib/store");
const { authenticate, requireRole } = require("../lib/auth");
const {
  DONOR_ROLES,
  validateDonation,
  validateRequest,
  validateConfirmation,
} = require("../lib/validate");
const { serializeDonation } = require("../lib/serialize");
const { upload, verifyImageContent, fileUrl, discardFile } = require("../lib/upload");
const { fail } = require("../lib/errors");
const { handoverCode } = require("../lib/security");

const router = express.Router();

router.use(authenticate);

function nextDonationId(state) {
  const max = state.donations.reduce((highest, donation) => {
    const numeric = parseInt(String(donation.id).replace(/\D/g, ""), 10);
    return Number.isFinite(numeric) ? Math.max(highest, numeric) : highest;
  }, 2000);
  return "FD-" + (max + 1);
}

function newRequestId() {
  return "RQ-" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function getDonation(state, id) {
  const donation = state.donations.find((entry) => entry.id === id);
  if (!donation) fail(404, "Donation not found.");
  return donation;
}

function isExpired(donation) {
  return new Date(donation.expiryTime).getTime() < Date.now();
}

function ensureOpen(donation) {
  if (donation.status !== "available" && donation.status !== "requested") {
    fail(409, "This donation is no longer accepting requests.");
  }
  if (isExpired(donation)) fail(409, "This donation has passed its safe-until window.");
}

router.get("/", (req, res, next) => {
  try {
    const state = store.getState();
    const scope = req.query.scope === "mine" ? "mine" : "board";
    const search = String(req.query.q || "").trim().toLowerCase();
    const category = String(req.query.category || "").trim();

    let donations;
    if (scope === "mine") {
      if (!DONOR_ROLES.includes(req.user.role)) {
        fail(403, "Only donors can view their own donations.");
      }
      donations = state.donations.filter((donation) => donation.donorId === req.user.id);
      const status = String(req.query.status || "").trim();
      if (status && status !== "all") {
        if (status === "active") {
          donations = donations.filter((donation) =>
            ["available", "requested", "accepted", "picked_up"].includes(donation.status)
          );
        } else {
          donations = donations.filter((donation) => donation.status === status);
        }
      }
    } else {
      donations = state.donations.filter(
        (donation) =>
          (donation.status === "available" || donation.status === "requested") &&
          !isExpired(donation)
      );
    }

    if (category) {
      donations = donations.filter((donation) => donation.category === category);
    }
    if (search) {
      donations = donations.filter((donation) => {
        const donor = state.users.find((user) => user.id === donation.donorId);
        return (
          donation.foodName.toLowerCase().includes(search) ||
          donation.id.toLowerCase().includes(search) ||
          donation.area.toLowerCase().includes(search) ||
          (donor && donor.organization.toLowerCase().includes(search))
        );
      });
    }

    let payload = donations
      .slice()
      .sort((a, b) => new Date(a.expiryTime) - new Date(b.expiryTime))
      .map((donation) => serializeDonation(donation, req.user, state));

    if (scope === "board" && req.query.sort === "distance") {
      payload.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }
    if (scope === "mine") {
      payload.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    res.json({ donations: payload, count: payload.length });
  } catch (error) {
    next(error);
  }
});

router.post("/", requireRole(...DONOR_ROLES), upload.single("photo"), (req, res, next) => {
  const file = req.file;
  try {
    const input = {
      ...req.body,
      area: req.body.area || req.user.area,
      pickupAddress: req.body.pickupAddress || req.user.address,
    };
    const data = validateDonation(input);
    if (file) verifyImageContent(file);

    let payload;
    store.mutate((state) => {
      const now = new Date().toISOString();
      const donation = {
        id: nextDonationId(state),
        donorId: req.user.id,
        foodName: data.foodName,
        category: data.category,
        servings: data.servings,
        weightKg: data.weightKg,
        prepTime: data.prepTime,
        expiryTime: data.expiryTime,
        area: data.area,
        pickupAddress: data.pickupAddress,
        notes: data.notes,
        imageUrl: file ? fileUrl(file) : null,
        status: "available",
        requests: [],
        acceptedRequestId: null,
        acceptedReceiverId: null,
        acceptedAt: null,
        handoverCode: null,
        pickedUpAt: null,
        deliveredAt: null,
        proofImageUrl: null,
        deliveryNotes: null,
        safetyChecklist: null,
        codeVerified: false,
        verifiedByDonor: false,
        verifiedAt: null,
        cancelledAt: null,
        createdAt: now,
        updatedAt: now,
      };
      state.donations.unshift(donation);
      payload = serializeDonation(donation, req.user, state);
    });
    res.status(201).json({ donation: payload });
  } catch (error) {
    discardFile(file);
    next(error);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    const state = store.getState();
    const donation = getDonation(state, req.params.id);
    const isParticipant =
      req.user.id === donation.donorId || req.user.id === donation.acceptedReceiverId;
    const isOpen = donation.status === "available" || donation.status === "requested";
    const requestedByViewer = donation.requests.some(
      (request) => request.receiverId === req.user.id
    );
    if (!isParticipant && !isOpen && !requestedByViewer) {
      fail(403, "You do not have access to this donation.");
    }
    res.json({ donation: serializeDonation(donation, req.user, state) });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/cancel", (req, res, next) => {
  try {
    let payload;
    store.mutate((state) => {
      const donation = getDonation(state, req.params.id);
      if (donation.donorId !== req.user.id) {
        fail(403, "Only the donor can cancel this donation.");
      }
      if (donation.status !== "available" && donation.status !== "requested") {
        fail(409, "A matched donation cannot be cancelled from the app. Please contact the receiver.");
      }
      const now = new Date().toISOString();
      donation.requests.forEach((request) => {
        if (request.status === "pending") {
          request.status = "declined";
          request.respondedAt = now;
        }
      });
      donation.status = "cancelled";
      donation.cancelledAt = now;
      donation.updatedAt = now;
      payload = serializeDonation(donation, req.user, state);
    });
    res.json({ donation: payload });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/request", requireRole("receiver"), (req, res, next) => {
  try {
    const data = validateRequest(req.body);
    let payload;
    store.mutate((state) => {
      const donation = getDonation(state, req.params.id);
      ensureOpen(donation);
      const existing = donation.requests.find(
        (request) =>
          request.receiverId === req.user.id &&
          (request.status === "pending" || request.status === "accepted")
      );
      if (existing) fail(409, "You have already requested this donation.");
      const now = new Date().toISOString();
      donation.requests.push({
        id: newRequestId(),
        receiverId: req.user.id,
        message: data.message,
        status: "pending",
        createdAt: now,
        respondedAt: null,
      });
      donation.status = "requested";
      donation.updatedAt = now;
      payload = serializeDonation(donation, req.user, state);
    });
    res.status(201).json({ donation: payload });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/requests/:requestId/accept", requireRole(...DONOR_ROLES), (req, res, next) => {
  try {
    let payload;
    store.mutate((state) => {
      const donation = getDonation(state, req.params.id);
      if (donation.donorId !== req.user.id) {
        fail(403, "Only the donor can accept requests for this donation.");
      }
      if (donation.status !== "available" && donation.status !== "requested") {
        fail(409, "This donation has already been matched.");
      }
      if (isExpired(donation)) fail(409, "This donation has passed its safe-until window.");
      const request = donation.requests.find((entry) => entry.id === req.params.requestId);
      if (!request) fail(404, "Request not found.");
      if (request.status !== "pending") fail(409, "This request has already been handled.");

      const now = new Date().toISOString();
      request.status = "accepted";
      request.respondedAt = now;
      donation.requests.forEach((entry) => {
        if (entry.id !== request.id && entry.status === "pending") {
          entry.status = "declined";
          entry.respondedAt = now;
        }
      });
      donation.status = "accepted";
      donation.acceptedRequestId = request.id;
      donation.acceptedReceiverId = request.receiverId;
      donation.acceptedAt = now;
      donation.handoverCode = handoverCode();
      donation.updatedAt = now;
      payload = serializeDonation(donation, req.user, state);
    });
    res.json({ donation: payload });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/requests/:requestId/decline", requireRole(...DONOR_ROLES), (req, res, next) => {
  try {
    let payload;
    store.mutate((state) => {
      const donation = getDonation(state, req.params.id);
      if (donation.donorId !== req.user.id) {
        fail(403, "Only the donor can decline requests for this donation.");
      }
      const request = donation.requests.find((entry) => entry.id === req.params.requestId);
      if (!request) fail(404, "Request not found.");
      if (request.status !== "pending") fail(409, "This request has already been handled.");

      const now = new Date().toISOString();
      request.status = "declined";
      request.respondedAt = now;
      const stillPending = donation.requests.some((entry) => entry.status === "pending");
      if (!stillPending && !donation.acceptedRequestId && donation.status === "requested") {
        donation.status = "available";
      }
      donation.updatedAt = now;
      payload = serializeDonation(donation, req.user, state);
    });
    res.json({ donation: payload });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/collected", requireRole("receiver"), (req, res, next) => {
  try {
    let payload;
    store.mutate((state) => {
      const donation = getDonation(state, req.params.id);
      if (donation.acceptedReceiverId !== req.user.id) {
        fail(403, "Only the matched receiver can update this delivery.");
      }
      if (donation.status === "picked_up") return;
      if (donation.status !== "accepted") {
        fail(409, "This delivery is not ready to be collected.");
      }
      const now = new Date().toISOString();
      donation.pickedUpAt = now;
      donation.status = "picked_up";
      donation.updatedAt = now;
      payload = serializeDonation(donation, req.user, state);
    });
    if (!payload) {
      const state = store.getState();
      payload = serializeDonation(getDonation(state, req.params.id), req.user, state);
    }
    res.json({ donation: payload });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/:id/confirm-delivery",
  requireRole("receiver"),
  upload.single("proof"),
  (req, res, next) => {
    const file = req.file;
    try {
      const data = validateConfirmation(req.body);
      if (!file) fail(400, "Attach a delivery photo as proof of handover.");
      verifyImageContent(file);

      let payload;
      store.mutate((state) => {
        const donation = getDonation(state, req.params.id);
        if (donation.acceptedReceiverId !== req.user.id) {
          fail(403, "Only the matched receiver can confirm this delivery.");
        }
        if (donation.status === "delivered") {
          fail(409, "This delivery has already been confirmed.");
        }
        if (donation.status !== "accepted" && donation.status !== "picked_up") {
          fail(409, "This delivery is not ready for confirmation.");
        }
        if (data.handoverCode !== donation.handoverCode) {
          fail(400, "That handover code doesn't match. Ask the donor to re-share the code.");
        }

        const now = new Date().toISOString();
        donation.proofImageUrl = fileUrl(file);
        donation.deliveryNotes = data.deliveryNotes;
        donation.safetyChecklist = true;
        donation.codeVerified = true;
        donation.status = "delivered";
        donation.deliveredAt = now;
        donation.pickedUpAt = donation.pickedUpAt || now;
        donation.updatedAt = now;
        payload = serializeDonation(donation, req.user, state);
      });
      res.json({ donation: payload });
    } catch (error) {
      discardFile(file);
      next(error);
    }
  }
);

router.post("/:id/verify", requireRole(...DONOR_ROLES), (req, res, next) => {
  try {
    let payload;
    store.mutate((state) => {
      const donation = getDonation(state, req.params.id);
      if (donation.donorId !== req.user.id) {
        fail(403, "Only the donor can verify this delivery.");
      }
      if (donation.status !== "delivered") {
        fail(409, "Delivery must be confirmed by the receiver before you can verify it.");
      }
      if (!donation.verifiedByDonor) {
        donation.verifiedByDonor = true;
        donation.verifiedAt = new Date().toISOString();
        donation.updatedAt = donation.verifiedAt;
      }
      payload = serializeDonation(donation, req.user, state);
    });
    res.json({ donation: payload });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
