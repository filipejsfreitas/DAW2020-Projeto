
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '@shared/constants';

/**
 * Simple middleware to extract the JWT token from either the Authorization header,
 * query string or request body, in this order, and save it to req.jwt.
 */
export default function (req: Request, res: Response, next: NextFunction) {
  // Find the token in the query string, body or authorization header
  const token = req.query?.token ?? req.body?.token ?? req.headers?.authorization?.replace('Bearer ', '');

  // Check if a token was actually found
  if (!token) {
    return next();
  }

  // Attempt to verify the validity of the token
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_KEY ?? 'DAW2020');
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      req.jwtExpired = true;
      return next();
    }

    if (error instanceof JsonWebTokenError) {
      if(error.message === 'jwt malformed') {
        req.jwtExpired = true;
        return next();
      }
    }

    throw error;
  }

  // Attempt to verify that a payload was returned
  if (!payload || typeof(payload) === 'string') {
    return next();
  }

  // Set token and continue
  req.jwt = payload as JwtPayload;
  next();
}
