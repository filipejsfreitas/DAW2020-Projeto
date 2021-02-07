import { prop, getModelForClass, plugin, mongoose } from '@typegoose/typegoose';
import { restify } from '../plugins/restify';

@plugin(restify)
export class ResourceType {
  public id!: mongoose.Types.ObjectId;
  
  @prop({ required: true })
  public name!: string;
}

export const ResourceTypeModel = getModelForClass(ResourceType);

/**
 * @swagger
 * components:
 *  schemas:
 *    ResourceType:
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
