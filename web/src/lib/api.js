import axios from "axios";
import { devlog } from "./devlog.js";

const API = import.meta.env.VITE_API_BASE;

export const api = axios.create({
  baseURL: API,
  headers: { "Cache-Control": "no-cache" },
  timeout: 15000
});

api.interceptors.request.use((cfg) => {
  cfg.metadata = { start: performance.now() };
  devlog.group(`HTTP ${cfg.method?.toUpperCase()} ${cfg.baseURL || ""}${cfg.url}`, () => {
    devlog.info("params", cfg.params || null);
    const h = { ...cfg.headers };
    if (h.Authorization) h.Authorization = "Bearer ******";
    devlog.info("headers", h);
  });
  return cfg;
});

api.interceptors.response.use(
  (res) => {
    const dur = performance.now() - (res.config.metadata?.start || performance.now());
    devlog.group(`HTTP ${res.status} ${res.config.url} (${Math.round(dur)}ms)`, () => {
      devlog.info("data", res.data);
      devlog.info("headers", res.headers);
    });
    return res;
  },
  (err) => {
    const cfg = err.config || {};
    const dur = performance.now() - (cfg.metadata?.start || performance.now());
    devlog.group(`HTTP ERROR ${cfg.url || ""} (${Math.round(dur)}ms)`, () => {
      devlog.error(err.message);
      devlog.info("response", err.response?.data);
    });
    return Promise.reject(err);
  }
);

// Global error traps
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => devlog.error("window.error", e.message));
  window.addEventListener("unhandledrejection", (e) => devlog.error("unhandledrejection", e.reason));
}
