"use strict";

const { fail } = require("./errors");
const { areaNames } = require("./areas");

const ROLES = ["restaurant", "function_hall", "receiver"];
const DONOR_ROLES = ["restaurant", "function_hall"];
const CATEGORIES = ["cooked", "bakery", "produce", "packaged", "dairy", "other"];

function text(value, label, min, max) {
  if (typeof value !== "string") fail(400, label + " is required.");
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length < min) fail(400, label + " must be at least " + min + " characters.");
  if (trimmed.length > max) fail(400, label + " must be at most " + max + " characters.");
  return trimmed;
}

function optionalText(value, label, max) {
  if (value === undefined || value === null || String(value).trim() === "") return "";
  const trimmed = String(value).trim();
  if (trimmed.length > max) fail(400, label + " must be at most " + max + " characters.");
  return trimmed;
}

function email(value) {
  if (typeof value !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
    fail(400, "Enter a valid email address.");
  }
  return value.trim().toLowerCase();
}

function password(value) {
  if (typeof value !== "string" || value.length < 8) {
    fail(400, "Password must be at least 8 characters.");
  }
  if (value.length > 100) fail(400, "Password is too long.");
  return value;
}

function phone(value) {
  const trimmed = String(value || "").trim();
  if (!/^[+()\d][\d\s()+-]{6,19}$/.test(trimmed)) {
    fail(400, "Enter a valid phone number (7-20 digits).");
  }
  return trimmed;
}

function area(value) {
  const trimmed = String(value || "").trim();
  if (!areaNames.has(trimmed)) fail(400, "Choose a valid pickup area.");
  return trimmed;
}

function integer(value, label, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num < min || num > max) {
    fail(400, label + " must be a whole number between " + min + " and " + max + ".");
  }
  return num;
}

function optionalNumber(value, label, min, max) {
  if (value === undefined || value === null || String(value).trim() === "") return null;
  const num = Number(value);
  if (!Number.isFinite(num) || num < min || num > max) {
    fail(400, label + " must be a number between " + min + " and " + max + ".");
  }
  return Math.round(num * 10) / 10;
}

function date(value, label) {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) fail(400, "Enter a valid " + label.toLowerCase() + ".");
  return parsed;
}

function validateRegister(input) {
  const role = String(input.role || "").trim();
  if (!ROLES.includes(role)) fail(400, "Choose an account type.");
  return {
    name: text(input.name, "Your name", 2, 60),
    email: email(input.email),
    password: password(input.password),
    role,
    organization: text(input.organization, "Organization name", 2, 80),
    phone: phone(input.phone),
    area: area(input.area),
    address: text(input.address, "Pickup address", 5, 160),
  };
}

function validateLogin(input) {
  if (typeof input.password !== "string" || input.password.length === 0) {
    fail(400, "Enter your password.");
  }
  return {
    email: email(input.email),
    password: input.password,
  };
}

function validateDonation(input) {
  const category = String(input.category || "").trim();
  if (!CATEGORIES.includes(category)) fail(400, "Choose a food category.");

  const prepTime = date(input.prepTime, "Preparation time");
  const expiryTime = date(input.expiryTime, "Safe-until time");
  const now = Date.now();
  if (prepTime.getTime() > now + 30 * 60 * 1000) {
    fail(400, "Preparation time cannot be in the future.");
  }
  if (expiryTime.getTime() <= prepTime.getTime()) {
    fail(400, "Safe-until time must be after the preparation time.");
  }
  if (expiryTime.getTime() < now + 15 * 60 * 1000) {
    fail(400, "Safe-until time must be at least 15 minutes from now.");
  }

  const servings = integer(input.servings, "Servings", 1, 1000);
  const weightKg = optionalNumber(input.weightKg, "Approximate weight", 0.1, 1000);

  return {
    foodName: text(input.foodName, "Food name", 3, 80),
    category,
    servings,
    weightKg: weightKg === null ? Math.round(servings * 0.3 * 10) / 10 : weightKg,
    prepTime: prepTime.toISOString(),
    expiryTime: expiryTime.toISOString(),
    area: area(input.area),
    pickupAddress: text(input.pickupAddress, "Pickup address", 5, 160),
    notes: optionalText(input.notes, "Notes", 500),
  };
}

function validateRequest(input) {
  return {
    message: text(input.message, "Message to the donor", 5, 300),
  };
}

function validateConfirmation(input) {
  const code = String(input.handoverCode || "").trim();
  if (!/^\d{4}$/.test(code)) fail(400, "Enter the 4-digit handover code from the donor.");
  if (String(input.checklist) !== "true") {
    fail(400, "Please confirm the food-safety checklist before completing delivery.");
  }
  return {
    handoverCode: code,
    deliveryNotes: optionalText(input.deliveryNotes, "Delivery notes", 300),
  };
}

module.exports = {
  ROLES,
  DONOR_ROLES,
  CATEGORIES,
  validateRegister,
  validateLogin,
  validateDonation,
  validateRequest,
  validateConfirmation,
};
