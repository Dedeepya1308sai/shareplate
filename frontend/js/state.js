import { getToken } from "./api.js";

export const state = {
  user: null,
  areas: [],
  route: "/",
  inbox: [],
  lastImpact: null,
};

export function isLoggedIn() {
  return Boolean(state.user && getToken());
}

export const DEMO_ACCOUNTS = [
  {
    role: "restaurant",
    label: "Restaurant owner",
    organization: "Green Fork Kitchen",
    email: "restaurant@demo.com",
  },
  {
    role: "function_hall",
    label: "Function hall manager",
    organization: "Grand Lotus Banquets",
    email: "banquet@demo.com",
  },
  {
    role: "receiver",
    label: "Food receiver",
    organization: "Asha Community Kitchen",
    email: "receiver@demo.com",
  },
];

export const DEMO_PASSWORD = "demo1234";
