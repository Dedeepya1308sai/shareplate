"use strict";

/**
 * End-to-end API smoke test.
 * Start the server first (npm start), then run: node scripts/smoke-test.js
 * It creates two throwaway accounts and removes the files it uploads.
 */

const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE_URL || "http://127.0.0.1:4000";
const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const imagePath = path.join(__dirname, "..", "..", "frontend", "assets", "food-biryani.jpg");
const imageBuffer = fs.readFileSync(imagePath);
const uploadedUrls = [];

let failures = 0;

function check(condition, label) {
  if (condition) {
    console.log("  PASS  " + label);
  } else {
    failures += 1;
    console.error("  FAIL  " + label);
  }
}

async function api(route, { method = "GET", token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = "Bearer " + token;
  let payload;
  if (form) {
    payload = form;
  } else if (body) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const response = await fetch(BASE + route, { method, headers, body: payload });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

function photoForm(fields) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  form.append("photo", new Blob([imageBuffer], { type: "image/jpeg" }), "smoke-food.jpg");
  return form;
}

function proofForm(fields) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value));
  form.append("proof", new Blob([imageBuffer], { type: "image/jpeg" }), "smoke-proof.jpg");
  return form;
}

function rememberUpload(donation) {
  for (const url of [donation.imageUrl, donation.proofImageUrl]) {
    if (url && url.startsWith("/uploads/")) uploadedUrls.push(url);
  }
}

async function main() {
  const stamp = Date.now();
  const password = "smoke-test-123";

  console.log("\nSharePlate API smoke test against " + BASE + "\n");

  const unauth = await api("/api/donations");
  check(unauth.status === 401, "Board requires authentication (401)");

  const registerDonor = await api("/api/auth/register", {
    method: "POST",
    body: {
      name: "Smoke Donor",
      email: "smoke-donor-" + stamp + "@example.com",
      password,
      role: "restaurant",
      organization: "Smoke Test Kitchen",
      phone: "+91 90000 10001",
      area: "Banjara Hills",
      address: "12 Test Road, Banjara Hills",
    },
  });
  check(registerDonor.status === 201 && !!registerDonor.data.token, "Donor registration");
  const donorToken = registerDonor.data.token;

  const registerReceiver = await api("/api/auth/register", {
    method: "POST",
    body: {
      name: "Smoke Receiver",
      email: "smoke-receiver-" + stamp + "@example.com",
      password,
      role: "receiver",
      organization: "Smoke Test Shelter",
      phone: "+91 90000 10002",
      area: "Madhapur",
      address: "8 Test Street, Madhapur",
    },
  });
  check(registerReceiver.status === 201 && !!registerReceiver.data.token, "Receiver registration");
  const receiverToken = registerReceiver.data.token;

  const duplicate = await api("/api/auth/register", {
    method: "POST",
    body: {
      name: "Duplicate",
      email: "smoke-donor-" + stamp + "@example.com",
      password,
      role: "restaurant",
      organization: "Duplicate Kitchen",
      phone: "+91 90000 10003",
      area: "Madhapur",
      address: "1 Duplicate Road",
    },
  });
  check(duplicate.status === 409, "Duplicate email is rejected");

  const login = await api("/api/auth/login", {
    method: "POST",
    body: { email: "smoke-donor-" + stamp + "@example.com", password },
  });
  check(login.status === 200 && login.data.user.organization === "Smoke Test Kitchen", "Login works");

  const badLogin = await api("/api/auth/login", {
    method: "POST",
    body: { email: "smoke-donor-" + stamp + "@example.com", password: "wrong-password" },
  });
  check(badLogin.status === 401, "Wrong password is rejected");

  const now = Date.now();
  const prepTime = new Date(now - 30 * 60 * 1000).toISOString();
  const expiryTime = new Date(now + 3 * 60 * 60 * 1000).toISOString();

  const invalidDonation = await api("/api/donations", {
    method: "POST",
    token: donorToken,
    form: photoForm({
      foodName: "Bad Times",
      category: "cooked",
      servings: 10,
      prepTime: expiryTime,
      expiryTime: prepTime,
      area: "Banjara Hills",
      pickupAddress: "12 Test Road",
    }),
  });
  check(invalidDonation.status === 400, "Donation validation rejects expiry before prep");

  const created = await api("/api/donations", {
    method: "POST",
    token: donorToken,
    form: photoForm({
      foodName: "Smoke Test Biryani",
      category: "cooked",
      servings: 24,
      weightKg: 7.2,
      prepTime,
      expiryTime,
      area: "Banjara Hills",
      pickupAddress: "12 Test Road, Banjara Hills",
      notes: "Sealed trays for the smoke test.",
    }),
  });
  check(created.status === 201 && created.data.donation.status === "available", "Donation posted with photo");
  check(
    !!created.data.donation.imageUrl && created.data.donation.imageUrl.startsWith("/uploads/"),
    "Uploaded photo is stored and returned"
  );
  const donationId = created.data.donation.id;
  rememberUpload(created.data.donation);

  const receiverTriesToPost = await api("/api/donations", {
    method: "POST",
    token: receiverToken,
    form: photoForm({
      foodName: "Should Fail",
      category: "cooked",
      servings: 5,
      prepTime,
      expiryTime,
      area: "Madhapur",
      pickupAddress: "8 Test Street",
    }),
  });
  check(receiverTriesToPost.status === 403, "Receivers cannot post donations");

  const board = await api("/api/donations?scope=board&sort=distance", { token: receiverToken });
  const listed = board.data.donations.find((donation) => donation.id === donationId);
  check(!!listed, "Donation appears on the receiver board");
  check(listed && listed.distanceKm > 0, "Distance matching is calculated");
  check(listed && listed.canRequest === true, "Open donation can be requested");
  check(listed && listed.handoverCode === undefined, "Handover code is hidden on the board");

  const request = await api("/api/donations/" + donationId + "/request", {
    method: "POST",
    token: receiverToken,
    body: { message: "We can collect within the hour with insulated bags." },
  });
  check(request.status === 201 && request.data.donation.myRequest.status === "pending", "Receiver requests food");

  const duplicateRequest = await api("/api/donations/" + donationId + "/request", {
    method: "POST",
    token: receiverToken,
    body: { message: "Trying to request twice." },
  });
  check(duplicateRequest.status === 409, "Duplicate request is blocked");

  const incoming = await api("/api/requests", { token: donorToken });
  const incomingRequest = incoming.data.requests.find((entry) => entry.donation.id === donationId);
  check(!!incomingRequest && incomingRequest.status === "pending", "Donor sees the incoming request");
  check(incomingRequest && incomingRequest.receiver.phone.length > 0, "Donor sees receiver contact details");

  const receiverHeader = await api("/api/requests", { token: receiverToken });
  const ownRequest = receiverHeader.data.requests.find((entry) => entry.donation.id === donationId);
  check(ownRequest && ownRequest.donation.handoverCode === null, "Receiver cannot see the handover code before delivery");

  const accept = await api(
    "/api/donations/" + donationId + "/requests/" + incomingRequest.id + "/accept",
    { method: "POST", token: donorToken }
  );
  const code = accept.data.donation && accept.data.donation.handoverCode;
  check(accept.status === 200 && accept.data.donation.status === "accepted", "Donor accepts the request");
  check(/^\d{4}$/.test(code || ""), "4-digit handover code is generated");

  const wrongCode = code === "1111" ? "2222" : "1111";
  const wrongConfirmation = await api("/api/donations/" + donationId + "/confirm-delivery", {
    method: "POST",
    token: receiverToken,
    form: proofForm({
      handoverCode: wrongCode,
      checklist: "true",
      deliveryNotes: "Wrong code attempt",
    }),
  });
  check(wrongConfirmation.status === 400, "Wrong handover code is rejected");

  const collected = await api("/api/donations/" + donationId + "/collected", {
    method: "POST",
    token: receiverToken,
  });
  check(collected.status === 200 && collected.data.donation.status === "picked_up", "Receiver marks food collected");

  const confirmation = await api("/api/donations/" + donationId + "/confirm-delivery", {
    method: "POST",
    token: receiverToken,
    form: proofForm({
      handoverCode: code,
      checklist: "true",
      deliveryNotes: "Handed over at the shelter entrance.",
    }),
  });
  check(
    confirmation.status === 200 && confirmation.data.donation.status === "delivered",
    "Delivery confirmed with photo proof"
  );
  check(
    !!confirmation.data.donation.proofImageUrl,
    "Proof photo URL is stored on the donation"
  );
  rememberUpload(confirmation.data.donation);

  const donorView = await api("/api/donations/" + donationId, { token: donorToken });
  check(
    donorView.data.donation.proofImageUrl === confirmation.data.donation.proofImageUrl,
    "Donor can view the delivery proof photo"
  );
  check(donorView.data.donation.canVerify === true, "Donor can verify the delivery");

  const verify = await api("/api/donations/" + donationId + "/verify", {
    method: "POST",
    token: donorToken,
  });
  check(
    verify.status === 200 && verify.data.donation.verifiedByDonor === true,
    "Donor verifies the delivered food"
  );

  const receiverTriesVerify = await api("/api/donations/" + donationId + "/verify", {
    method: "POST",
    token: receiverToken,
  });
  check(receiverTriesVerify.status === 403, "Receiver cannot mark the donor verification");

  const impact = await api("/api/impact");
  check(impact.status === 200 && impact.data.impact.meals > 0, "Impact dashboard aggregates meals");
  check(impact.data.impact.co2Kg > 0, "Impact dashboard includes CO2 savings");

  for (const url of uploadedUrls) {
    const file = path.join(UPLOAD_DIR, path.basename(url));
    try {
      fs.rmSync(file, { force: true });
    } catch (_) {
      /* ignore cleanup failures */
    }
  }

  console.log("\n" + (failures === 0 ? "All checks passed." : failures + " check(s) failed.") + "\n");
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
