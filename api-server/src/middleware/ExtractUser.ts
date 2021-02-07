import { Request, Response, NextFunction } from 'express';

import { UserModel } from '@models/User';

export default async function (req: Request, res: Response, next: NextFunction) {
  // Verify that a token was introduced
  if (!req.jwt) {
    return next();
  }

  // Attempt to find the user in the database
  const user = await UserModel.findById(req.jwt.uid).exec();

  if(user) {
    if(!user.destroyedTokens.includes(req.jwt.jti)) {
      req.user = user;
    }
  }

  // On to the next middleware
  return next();
}
