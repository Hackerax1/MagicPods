// src/lib/server/utils/security/sanitize.ts
function sanitizeString(input) {
  if (!input) return input;
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;").replace(/\//g, "&#x2F;");
}
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
function validateAndSanitizeEmail(email) {
  if (!email) return "";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "";
  }
  return sanitizeString(email);
}
function validateAndSanitizeUsername(username) {
  if (!username) return "";
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    return "";
  }
  return sanitizeString(username);
}
export {
  sanitizeObject,
  sanitizeString,
  validateAndSanitizeEmail,
  validateAndSanitizeUsername
};
