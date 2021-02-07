import { DocumentType, mongoose } from '@typegoose/typegoose';
import { User as UserClass } from '../../src/models/User';
import { JwtPayload } from '../../src/shared/constants';

declare global {
  namespace Express {
    export interface User extends DocumentType<UserClass> {}

    interface Request {
      jwt?: JwtPayload;
      jwtExpired?: boolean;
    }
  }
}
