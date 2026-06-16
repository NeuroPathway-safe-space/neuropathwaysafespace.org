import { nanoid } from "nanoid";

export function requestId(req, res, next) {
  req.requestId = nanoid(10);
  res.setHeader("X-Request-Id", req.requestId);
  next();
}
