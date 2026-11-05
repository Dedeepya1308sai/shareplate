# SharePlate — Smart Food Waste Redistribution System

A working full-stack prototype of the **Smart Food Waste Redistribution System** described in the project
presentation. Restaurants and function halls post surplus food; community kitchens and NGOs nearby request it;
every handover is closed with a **4-digit code plus a delivery photo**, and the donor verifies the photo before
the delivery is marked complete.

This is a functioning application, not a mock-up: registration, login, listings, requests, matching, delivery
tracking, photo upload, and donor verification all run against a real backend and persist to disk.

---

## 1. Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Vanilla HTML, CSS and ES modules (no build step), served by the backend |
| Backend | Node.js 18+ with Express 4 |
| Uploads | Multer 2 with magic-byte validation (JPG / PNG / WebP, max 5 MB) |
| Storage | JSON file database with atomic writes (`backend/data/db.json`), plus `backend/uploads/` for photos |
| Auth | Bearer session tokens (7 days), scrypt password hashing |
| Fonts / icons | Google Fonts (Fraunces + Inter) and inline SVG sprites |

> **Note on the PPT architecture:** the presentation proposes Java/Spring Boot with MySQL. This prototype
> implements the same features and workflow with Node.js/Express and a file-backed store so it can be run with
> a single command and no database installation. The API and data model map cleanly onto a future Spring/MySQL
> implementation (see §9).

---

## 2. Folder structure

```
smart-food-redistribution/
├── README.md
├── .gitignore
├── frontend/
│   ├── index.html              # Single-page app shell
│   ├── css/styles.css          # Design system, layout, responsive rules
│   ├── assets/                 # Food photography, hero, proof images, favicon
│   └── js/
│       ├── app.js              # Router, session bootstrap, app shell, notifications
│       ├── api.js              # Typed wrapper around the REST API
│       ├── state.js            # Client state and demo accounts
│       ├── ui.js               # Icons, formatting, charts, modals, toasts, image tools
│       ├── components.js       # Shared cards, dialogs and action bindings
│       └── views/              # landing, auth, donor, receiver, requests, impact
└── backend/
    ├── package.json
    ├── server.js               # Starts Express and prints demo credentials
    ├── data/db.json            # Generated on first run (demo seed)
    ├── uploads/                # Uploaded donation photos and delivery proofs
    └── src/
        ├── app.js              # Express app, security headers, static hosting
        ├── reset.js            # `npm run reset` removes the database file
        ├── lib/                # store, seed data, validation, auth, serialization, uploads
        └── routes/             # auth, donations, requests, impact
```

---

## 3. Quick start

Requirements: **Node.js 18 or newer** (tested on Node 24). No database or build tool is required.

```bash
cd smart-food-redistribution/backend
npm install
npm start
```

Then open **http://localhost:4000**.

- The first start seeds a demo database in `backend/data/db.json` with users, listings, handovers and
  delivery proofs so every screen has realistic content.
- The backend serves both the API and the frontend, so there is nothing else to launch.
- Use `npm run dev` for auto-restart while editing.
- Set `PORT` to use another port: `PORT=5000 npm start` (Windows: `set PORT=5000 && npm start`).

### Demo accounts

All demo accounts use the password **`demo1234`**.

| Role | Email | Organization |
| --- | --- | --- |
| Restaurant owner (donor) | `restaurant@demo.com` | Green Fork Kitchen |
| Function hall (donor) | `banquet@demo.com` | Grand Lotus Banquets |
| Food receiver | `receiver@demo.com` | Asha Community Kitchen |

You can also create a fresh account from the **Create account** tab and choose Restaurant, Function hall or
Food receiver.

---

## 4. The complete workflow (try it end to end)

1. **Donor registers / signs in** (or use `restaurant@demo.com`).
2. **Post surplus** — Dashboard → *Post surplus*. Enter food name, category, servings, weight, preparation
   time, safe-until time, pickup area, address, notes, and attach a photo. The form validates the safe window
   (prep cannot be in the future, expiry must be at least 15 minutes away).
3. **Receiver browses the board** (or use `receiver@demo.com`) — filter by category, search, sort by distance
   or expiry, then open a listing and send a request with a pickup message.
4. **Donor accepts the request** — Dashboard → *Requests*. Accepting matches the receiver, declines the other
   pending requests, and generates a **4-digit handover code** that only the donor can see.
5. **Coordinate the handover** — after acceptance both sides see each other's contact details. The receiver can
   mark the food as **collected**.
6. **Receiver confirms delivery** — *My requests* → *Confirm delivery* → enter the donor's 4-digit code, tick
   the food-safety checklist, attach a **delivery photo**, and submit.
   The donation becomes **Delivered** only when the photo and the matching code are accepted by the server.
7. **Donor verifies** — the donor sees the stored confirmation photo on the delivery record and clicks
   **Verify delivery**. The record is then marked **Donor verified**, closing the loop.
8. **Impact page** aggregates meals rescued, kilograms diverted, CO₂e avoided, category breakdown and a
   14-day timeline.

Anything that breaks the rules is rejected by the backend with a readable message: wrong handover code,
expired safe window, duplicate request, confirming without a photo, verifying before delivery, and so on.

---

## 5. Features

**Accounts and roles**
- Registration and login for three roles: restaurant owner, function hall manager, food receiver.
- Session restore on reload, role-based navigation, route guards, sign out.
- Passwords hashed with scrypt; login throttling after repeated failures.

**Donors (restaurants and function halls)**
- Post surplus with photo, quantity, prep time, safe-until window and pickup details.
- Dashboard with live listings, pending requests, handovers, verified deliveries and meals posted.
- Request inbox with accept/decline; acceptance generates the handover code.
- Handover cards showing the code and receiver contact; delivery records with the receiver's photo proof.
- Verify a delivery after inspecting the proof.

**Receivers (community kitchens and NGOs)**
- Food board with category filters, search, and closest/expiring sort.
- Request dialog, request tracking, contact details after acceptance.
- Mark collected, then confirm delivery with code + checklist + photo.
- Delivery history with the stored proof image.

**Platform**
- Public landing page with live impact numbers, stats, workflow and call to action.
- Notifications inbox derived from pending requests and handovers that need action.
- Responsive layout: sidebar on desktop, slide-in drawer and bottom navigation on mobile.
- Accessible dialogs, focus states, reduced-motion support, and inline error messages.
- Server-side validation, participant-only visibility, CSP and security headers.

---

## 6. API reference

All endpoints are under `/api`. Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Service check |
| GET | `/areas` | Hyderabad service areas |
| POST | `/auth/register` | Create an account and start a session |
| POST | `/auth/login` | Sign in |
| GET | `/auth/me` | Current user |
| POST | `/auth/logout` | Revoke the session |
| GET | `/donations?scope=board&q=&category=&sort=distance` | Public board |
| GET | `/donations?scope=mine&status=all` | Donor's own listings |
| POST | `/donations` | Create a donation (multipart, field `photo`) |
| GET | `/donations/:id` | Donation detail (access-controlled) |
| POST | `/donations/:id/cancel` | Cancel an unmatched donation |
| POST | `/donations/:id/request` | Receiver requests food |
| POST | `/donations/:id/requests/:requestId/accept` | Donor accepts; generates handover code |
| POST | `/donations/:id/requests/:requestId/decline` | Donor declines a request |
| POST | `/donations/:id/collected` | Receiver marks food collected |
| POST | `/donations/:id/confirm-delivery` | Receiver confirms with `handoverCode`, `deliveryNotes`, checklist and proof photo (multipart, field `proof`) |
| POST | `/donations/:id/verify` | Donor verifies a delivered handover |
| GET | `/requests?status=` | Requests visible to the signed-in user |
| GET | `/impact` | Aggregated impact metrics |

Donation lifecycle:

```
available → requested → accepted → picked_up → delivered
     ↘ cancelled
```

---

## 7. Data, uploads and reset

- `backend/data/db.json` holds users, donations (including the stored proof URL), and requests. Writes are
  atomic (`db.json.tmp` then rename).
- Uploaded photos are stored in `backend/uploads/` and served from `/uploads/<file>`. The server checks the
  file signature, not just the extension, and rejects anything that is not a real JPG, PNG or WebP.
- The delivery photo is attached to the donation (`proofImageUrl`) only when the receiver confirms with the
  correct code. It is returned to the donor and the matched receiver, not to other users.
- To restore the demo data:

```bash
cd backend
# stop the running server first
npm run reset
npm start
```

`npm run reset` deletes `db.json`; the next start seeds a fresh demo database. Seeded proof images
(`seed-proof-handover*.jpg`) should stay in `uploads/`; other files there are user uploads.

---

## 8. Security and validation highlights

- scrypt password hashing with per-user salts; no plaintext passwords are stored.
- Bearer tokens are random 32-byte values with a 7-day expiry; logout revokes them.
- Login throttling (8 failures per 10 minutes per IP).
- Role checks on every mutation: only donors can post/accept/verify, only receivers can request/confirm.
- Handover codes are shown only to the donor; contacts unlock only after a request is accepted.
- The receiver's delivery photo is required and validated by content before the status can become Delivered.
- Request bodies are validated and normalized server-side; uploads are size- and type-limited.
- CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and a restrictive
  `Permissions-Policy` are set for every response.

---

## 9. Mapping to the presentation and next steps

| PPT concept | Implemented as |
| --- | --- |
| Donor and receiver registration | Role-aware registration and login |
| Surplus listing with quantity, timings, location, images | Donation form with photo upload |
| Nearby matching | Area list, distance calculation, board sorting and filters |
| Request and approval workflow | Request, accept/decline, status transitions |
| Handover coordination | Contact unlock, handover code, collected state |
| Proof of delivery | Required photo + code confirmation stored with the donation |
| Donor verification | Donor views proof and verifies the delivery |
| Impact reporting | Meals, kg, CO₂e, category chart, 14-day timeline |

Possible production follow-ups: move the JSON store to MySQL/PostgreSQL, add real-time notifications
(WebSocket or push), SMS/WhatsApp handover codes, map-based pickup routing, and audit logging.

---

## 10. Notes

- The app expects to own its port. If `npm start` reports `EADDRINUSE`, stop the other process or run with
  another `PORT`.
- The prototype is intended for local demonstration; for deployment, put it behind HTTPS, move sessions to a
  proper store, and configure a persistent object store for uploads.
