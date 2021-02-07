import { prop, getModelForClass, plugin, mongoose } from '@typegoose/typegoose';
import { restify } from '../plugins/restify';

@plugin(restify)
export class UserRole {
  public id!: mongoose.Types.ObjectId;
  
  @prop({ required: true })
  public name!: string;
}

export const UserRoleModel = getModelForClass(UserRole);

/**
 * @swagger
 * components:
 *  schemas:
 *    UserRole:
 *      type: object
 *      required:
 *        - id
 *        - name
 *      properties:
 *        id:
 *          type: string
 *        name:
 *          type: string
 */
