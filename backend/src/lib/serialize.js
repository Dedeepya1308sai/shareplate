"use strict";

const { distanceKm } = require("./areas");

function publicUser(user, { contact = false } = {}) {
  if (!user) return null;
  const base = {
    id: user.id,
    name: user.name,
    organization: user.organization,
    role: user.role,
    area: user.area,
  };
  if (contact) {
    base.phone = user.phone;
    base.email = user.email;
    base.address = user.address;
  }
  return base;
}

function selfUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    organization: user.organization,
    phone: user.phone,
    area: user.area,
    address: user.address,
    createdAt: user.createdAt,
  };
}

function findUser(state, id) {
  return state.users.find((user) => user.id === id) || null;
}

function requestView(request, state) {
  const receiver = findUser(state, request.receiverId);
  return {
    id: request.id,
    receiverId: request.receiverId,
    message: request.message,
    status: request.status,
    createdAt: request.createdAt,
    respondedAt: request.respondedAt,
    receiver: publicUser(receiver, { contact: true }),
  };
}

function serializeDonation(donation, viewer, state) {
  const donor = findUser(state, donation.donorId);
  const acceptedReceiver = donation.acceptedReceiverId
    ? findUser(state, donation.acceptedReceiverId)
    : null;
  const isOwner = Boolean(viewer && viewer.id === donation.donorId);
  const isAcceptedReceiver = Boolean(viewer && viewer.id === donation.acceptedReceiverId);
  const isParticipant = isOwner || isAcceptedReceiver;
  const myRequest = viewer
    ? donation.requests.find((request) => request.receiverId === viewer.id) || null
    : null;
  const pendingRequests = donation.requests.filter((request) => request.status === "pending");
  const distance =
    viewer && viewer.area ? distanceKm(donor ? donor.area : donation.area, viewer.area) : null;
  const expired = new Date(donation.expiryTime).getTime() < Date.now();

  const payload = {
    id: donation.id,
    foodName: donation.foodName,
    category: donation.category,
    servings: donation.servings,
    weightKg: donation.weightKg,
    prepTime: donation.prepTime,
    expiryTime: donation.expiryTime,
    area: donation.area,
    pickupAddress: donation.pickupAddress,
    notes: donation.notes,
    imageUrl: donation.imageUrl,
    status: donation.status,
    createdAt: donation.createdAt,
    updatedAt: donation.updatedAt,
    acceptedAt: donation.acceptedAt,
    pickedUpAt: donation.pickedUpAt,
    deliveredAt: donation.deliveredAt,
    verifiedByDonor: donation.verifiedByDonor,
    verifiedAt: donation.verifiedAt,
    codeVerified: donation.codeVerified,
    cancelledAt: donation.cancelledAt,
    expired,
    distanceKm: distance,
    isOwner,
    donor: publicUser(donor, { contact: isParticipant }),
    requestCount: isOwner ? pendingRequests.length : undefined,
    myRequest: myRequest
      ? {
          id: myRequest.id,
          status: myRequest.status,
          message: myRequest.message,
          createdAt: myRequest.createdAt,
          respondedAt: myRequest.respondedAt,
        }
      : null,
    acceptedReceiver:
      isParticipant && acceptedReceiver
        ? publicUser(acceptedReceiver, { contact: true })
        : null,
    handoverCode: isOwner ? donation.handoverCode : undefined,
    hasHandoverCode: Boolean(donation.handoverCode),
    canRequest:
      Boolean(viewer) &&
      viewer.role === "receiver" &&
      !myRequest &&
      !expired &&
      (donation.status === "available" || donation.status === "requested"),
    canConfirm:
      isAcceptedReceiver &&
      (donation.status === "accepted" || donation.status === "picked_up"),
    canMarkCollected: isAcceptedReceiver && donation.status === "accepted",
    canCancel:
      isOwner && (donation.status === "available" || donation.status === "requested"),
    canVerify: isOwner && donation.status === "delivered" && !donation.verifiedByDonor,
  };

  if (isOwner) {
    payload.requests = donation.requests
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((request) => requestView(request, state));
  }

  if (isParticipant && donation.status === "delivered") {
    payload.proofImageUrl = donation.proofImageUrl;
    payload.deliveryNotes = donation.deliveryNotes;
    payload.safetyChecklist = donation.safetyChecklist;
  }

  return payload;
}

function serializeRequest(request, donation, viewer, state) {
  const donor = findUser(state, donation.donorId);
  const receiver = findUser(state, request.receiverId);
  const viewerIsDonor = viewer.id === donation.donorId;
  const viewerIsReceiver = viewer.id === request.receiverId;
  const handoverShared = viewerIsDonor;

  return {
    id: request.id,
    status: request.status,
    message: request.message,
    createdAt: request.createdAt,
    respondedAt: request.respondedAt,
    donation: {
      id: donation.id,
      foodName: donation.foodName,
      category: donation.category,
      servings: donation.servings,
      weightKg: donation.weightKg,
      imageUrl: donation.imageUrl,
      area: donation.area,
      pickupAddress: donation.pickupAddress,
      expiryTime: donation.expiryTime,
      status: donation.status,
      acceptedAt: donation.acceptedAt,
      pickedUpAt: donation.pickedUpAt,
      deliveredAt: donation.deliveredAt,
      verifiedByDonor: donation.verifiedByDonor,
      isOwner: viewerIsDonor,
      canConfirm:
        viewerIsReceiver &&
        request.status === "accepted" &&
        (donation.status === "accepted" || donation.status === "picked_up"),
      canMarkCollected:
        viewerIsReceiver && request.status === "accepted" && donation.status === "accepted",
      canVerify:
        viewerIsDonor && donation.status === "delivered" && !donation.verifiedByDonor,
      proofImageUrl:
        donation.status === "delivered" && (viewerIsDonor || viewerIsReceiver)
          ? donation.proofImageUrl
          : null,
      deliveryNotes:
        donation.status === "delivered" && viewerIsDonor ? donation.deliveryNotes : null,
      handoverCode: handoverShared ? donation.handoverCode : null,
      hasHandoverCode: Boolean(donation.handoverCode),
      distanceKm: distanceKm(donation.area, viewer.area),
    },
    donor: publicUser(donor, { contact: viewerIsReceiver && request.status === "accepted" }),
    receiver: publicUser(receiver, { contact: viewerIsDonor }),
  };
}

function buildImpact(state) {
  const delivered = state.donations.filter((donation) => donation.status === "delivered");
  const available = state.donations.filter(
    (donation) =>
      (donation.status === "available" || donation.status === "requested") &&
      new Date(donation.expiryTime).getTime() > Date.now()
  );
  const openRequests = state.donations.reduce(
    (sum, donation) =>
      sum + donation.requests.filter((request) => request.status === "pending").length,
    0
  );

  const meals = delivered.reduce((sum, donation) => sum + donation.servings, 0);
  const weightKg = delivered.reduce((sum, donation) => sum + (donation.weightKg || 0), 0);
  const co2Kg = Math.round(weightKg * 2.5 * 10) / 10;
  const verifiedDeliveries = delivered.filter((donation) => donation.verifiedByDonor).length;

  const categoryMap = new Map();
  for (const donation of delivered) {
    categoryMap.set(
      donation.category,
      (categoryMap.get(donation.category) || 0) + donation.servings
    );
  }
  const byCategory = Array.from(categoryMap.entries())
    .map(([category, categoryMeals]) => ({ category, meals: categoryMeals }))
    .sort((a, b) => b.meals - a.meals);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const timeline = [];
  for (let index = 13; index >= 0; index -= 1) {
    const day = new Date(today.getTime() - index * 24 * 60 * 60 * 1000);
    const key = day.toISOString().slice(0, 10);
    const dayMeals = delivered
      .filter((donation) => donation.deliveredAt && donation.deliveredAt.slice(0, 10) === key)
      .reduce((sum, donation) => sum + donation.servings, 0);
    timeline.push({ date: key, meals: dayMeals });
  }

  const donorMap = new Map();
  for (const donation of delivered) {
    const donor = findUser(state, donation.donorId);
    if (!donor) continue;
    const current = donorMap.get(donor.id) || {
      id: donor.id,
      organization: donor.organization,
      role: donor.role,
      meals: 0,
      deliveries: 0,
      verified: 0,
    };
    current.meals += donation.servings;
    current.deliveries += 1;
    if (donation.verifiedByDonor) current.verified += 1;
    donorMap.set(donor.id, current);
  }
  const topDonors = Array.from(donorMap.values())
    .sort((a, b) => b.meals - a.meals)
    .slice(0, 5);

  const recent = delivered
    .slice()
    .sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt))
    .slice(0, 6)
    .map((donation) => {
      const donor = findUser(state, donation.donorId);
      const receiver = findUser(state, donation.acceptedReceiverId);
      return {
        id: donation.id,
        foodName: donation.foodName,
        category: donation.category,
        servings: donation.servings,
        deliveredAt: donation.deliveredAt,
        area: donation.area,
        donor: donor ? donor.organization : "Donor",
        receiver: receiver ? receiver.organization : "Receiver",
      };
    });

  return {
    meals,
    weightKg: Math.round(weightKg * 10) / 10,
    co2Kg,
    deliveries: delivered.length,
    verifiedDeliveries,
    availableDonations: available.length,
    availableMeals: available.reduce((sum, donation) => sum + donation.servings, 0),
    openRequests,
    donors: state.users.filter((user) => user.role !== "receiver").length,
    receivers: state.users.filter((user) => user.role === "receiver").length,
    byCategory,
    timeline,
    topDonors,
    recent,
    co2Factor: 2.5,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  publicUser,
  selfUser,
  serializeDonation,
  serializeRequest,
  buildImpact,
};
