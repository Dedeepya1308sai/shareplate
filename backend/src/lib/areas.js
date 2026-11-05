"use strict";

const AREAS = [
  { name: "Banjara Hills", lat: 17.4126, lng: 78.4392 },
  { name: "Jubilee Hills", lat: 17.4239, lng: 78.411 },
  { name: "Madhapur", lat: 17.4483, lng: 78.3915 },
  { name: "Gachibowli", lat: 17.4401, lng: 78.3489 },
  { name: "Kondapur", lat: 17.4614, lng: 78.3645 },
  { name: "Ameerpet", lat: 17.4375, lng: 78.4483 },
  { name: "Begumpet", lat: 17.4447, lng: 78.4662 },
  { name: "Secunderabad", lat: 17.4399, lng: 78.4983 },
  { name: "Kukatpally", lat: 17.4849, lng: 78.401 },
  { name: "LB Nagar", lat: 17.3457, lng: 78.5522 },
  { name: "Charminar", lat: 17.3616, lng: 78.4747 },
];

const areaNames = new Set(AREAS.map((area) => area.name));

function distanceKm(fromName, toName) {
  const from = AREAS.find((area) => area.name === fromName);
  const to = AREAS.find((area) => area.name === toName);
  if (!from || !to) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10;
}

module.exports = { AREAS, areaNames, distanceKm };
