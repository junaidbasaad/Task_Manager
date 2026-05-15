import { env } from "../config/env.js";

/**
 * @param {string | undefined} origin
 * @param {(err: Error | null, allow?: boolean) => void} callback
 */
export function corsOrigin(origin, callback) {
  if (!origin) {
    return callback(null, true);
  }
  const normalized = origin.replace(/\/$/, "");
  if (env.allowedOrigins.includes(normalized)) {
    return callback(null, true);
  }
  if (!env.isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(normalized)) {
    return callback(null, true);
  }
  return callback(null, false);
}
