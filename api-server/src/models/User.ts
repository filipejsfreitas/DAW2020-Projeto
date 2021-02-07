import { prop, modelOptions, plugin, mongoose, DocumentType, buildSchema, addModelToTypegoose } from '@typegoose/typegoose';
import { PassportLocalModel } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import passportLocalMongoose from 'passport-local-mongoose';
import { restify } from '../plugins/restify';

import { UserRole } from './UserRole';

@modelOptions({ schemaOptions: { timestamps: true } })
@plugin(restify)
export class User {
  public id!: mongoose.Types.ObjectId;
  
  @prop({ required: true })
  public name!: string;

  @prop({ required: true })
  public email!: string;

  @prop({ required: true, ref: UserRole, autopopulate: true })
  public role!: UserRole;
  
  @prop({ required: true })
  public affiliation!: string;

  @prop({ required: true, type: () => [Number] })
  public destroyedTokens!: number[];

  @prop({ select: false })
  public salt?: string;

  @prop({ selected: false })
  public hash?: string;
}

const UserSchema = buildSchema(User);
UserSchema.plugin(passportLocalMongoose, { usernameField: 'email' })

const TheUserModel = addModelToTypegoose(mongoose.model('User', UserSchema), User);

export const UserModel = TheUserModel as unknown as (PassportLocalModel<DocumentType<User>>);

/**
 * @swagger
 * components:
 *  schemas:
 *    User:
 *      type: object
 *      required:
 *        - id
 *        - name
 *        - email
 *        - role
 *        - affiliation
 *        - destroyedTokens
 *        - createdAt
 *        - updatedAt
 *      properties:
 *        id:
 *          type: string
 *        name:
 *          type: string
 *        email:
 *          type: string
 *        password:
 *          type: string
 *        role:
 *          $ref: '#/components/schemas/UserRole'
 *        affiliation:
 *          type: string
 *        destroyedTokens:
 *          type: array
 *          items:
 *            type: number
 *            description: ids of the JWTs that this user isn't allowed to use (aka, logged out session ids)
 *        createdAt:
 *          type: string
 *        updatedAt:
 *          type: string
 */
