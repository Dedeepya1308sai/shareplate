"use strict";

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const fail = (status, message, details) => {
  throw new HttpError(status, message, details);
};

module.exports = { HttpError, fail };
