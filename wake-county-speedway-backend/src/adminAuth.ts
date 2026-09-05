import type { NextFunction, Request, Response } from 'express';

/**
 * Shared-secret auth for the handful of staff who update banner ads / food
 * vendors / social accounts. Fine for a small track's staff list at
 * launch; swap for per-user accounts before handing this out more widely.
 */
export function requireAdminKey(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    res.status(500).json({ error: 'Server is not configured with ADMIN_API_KEY.' });
    return;
  }
  const provided = req.header('x-admin-key');
  if (provided !== expected) {
    res.status(401).json({ error: 'Invalid or missing x-admin-key header.' });
    return;
  }
  next();
}
