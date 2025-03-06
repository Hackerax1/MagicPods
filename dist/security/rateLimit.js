// node_modules/@sveltejs/kit/src/runtime/control.js
var HttpError = class {
  /**
   * @param {number} status
   * @param {{message: string} extends App.Error ? (App.Error | string | undefined) : App.Error} body
   */
  constructor(status, body) {
    this.status = status;
    if (typeof body === "string") {
      this.body = { message: body };
    } else if (body) {
      this.body = body;
    } else {
      this.body = { message: `Error: ${status}` };
    }
  }
  toString() {
    return JSON.stringify(this.body);
  }
};

// node_modules/esm-env/browser-fallback.js
var browser_fallback_default = typeof window !== "undefined";

// node_modules/esm-env/dev-fallback.js
var node_env = globalThis.process?.env?.NODE_ENV;
var dev_fallback_default = node_env && !node_env.toLowerCase().startsWith("prod");

// node_modules/@sveltejs/kit/src/exports/index.js
function error(status, body) {
  if ((!browser_fallback_default || dev_fallback_default) && (isNaN(status) || status < 400 || status > 599)) {
    throw new Error(`HTTP error status codes must be between 400 and 599 \u2014 ${status} is invalid`);
  }
  throw new HttpError(status, body);
}
var encoder = new TextEncoder();

// src/lib/server/utils/security/rateLimit.ts
var ipRequests = /* @__PURE__ */ new Map();
var DEFAULT_WINDOW_MS = 15 * 60 * 1e3;
var DEFAULT_MAX_REQUESTS = 100;
function rateLimit(options = {}) {
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
  const maxRequests = options.maxRequests || DEFAULT_MAX_REQUESTS;
  const message = options.message || "Too many requests, please try again later.";
  const statusCode = options.statusCode || 429;
  return async function handleRateLimit(event) {
    const clientIp = event.getClientAddress();
    const now = Date.now();
    let requestData = ipRequests.get(clientIp);
    if (!requestData || now > requestData.resetTime) {
      requestData = { count: 0, resetTime: now + windowMs };
      ipRequests.set(clientIp, requestData);
    }
    requestData.count++;
    if (requestData.count > maxRequests) {
      event.setHeaders({
        "Retry-After": String(Math.ceil(requestData.resetTime - now) / 1e3),
        "X-RateLimit-Limit": String(maxRequests),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(requestData.resetTime / 1e3))
      });
      throw error(statusCode, message);
    }
    event.setHeaders({
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": String(maxRequests - requestData.count),
      "X-RateLimit-Reset": String(Math.ceil(requestData.resetTime / 1e3))
    });
  };
}
var authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  maxRequests: 10,
  // 10 login attempts per 15 minutes
  message: "Too many login attempts, please try again later."
});
var standardRateLimit = rateLimit();
function cleanupRateLimitData() {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now > data.resetTime) {
      ipRequests.delete(ip);
    }
  }
}
export {
  authRateLimit,
  cleanupRateLimitData,
  rateLimit,
  standardRateLimit
};
