import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { log } from "../logger";

export function requestId(req: Request, res: Response, next: NextFunction) {
  (req as any).id = randomUUID();
  (res as any).start = process.hrtime.bigint();
  log("http.start", { id: (req as any).id, method: req.method, path: req.path, q: req.query });
  res.on("finish", () => {
    const dur = Number((process as any).hrtime.bigint() - (res as any).start) / 1e6;
    log("http.finish", { id: (req as any).id, status: res.statusCode, ms: Math.round(dur) });
  });
  next();
}
