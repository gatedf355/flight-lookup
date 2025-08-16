import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino(
  isProd
    ? { level: process.env.LOG_LEVEL || "info" }
    : {
        level: process.env.LOG_LEVEL || "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:HH:MM:ss.l",
            ignore: "pid,hostname",
            singleLine: false
          }
        }
      }
);

export function maskHeaders(h = {}) {
  const copy = { ...h };
  if (copy.authorization) copy.authorization = "Bearer ******";
  if (copy.Authorization) copy.Authorization = "Bearer ******";
  return copy;
}
