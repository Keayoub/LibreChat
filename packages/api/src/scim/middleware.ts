import { timingSafeEqual } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { sendScimError } from './utils';

/** Bearer token auth middleware for SCIM 2.0. Reads the SCIM_SECRET environment variable. */
export function scimBearerAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.SCIM_SECRET;

  if (!secret) {
    sendScimError(res, 503, 'SCIM provisioning is not configured on this server');
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="scim"');
    sendScimError(res, 401, 'Missing or invalid Authorization header');
    return;
  }

  const token = authHeader.slice(7);
  const secretBuf = Buffer.from(secret, 'utf8');
  const tokenBuf = Buffer.from(token, 'utf8');

  const valid =
    tokenBuf.length === secretBuf.length && timingSafeEqual(tokenBuf, secretBuf);

  if (!valid) {
    res.setHeader('WWW-Authenticate', 'Bearer realm="scim"');
    sendScimError(res, 401, 'Invalid token');
    return;
  }

  next();
}
