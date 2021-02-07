import { prop, getModelForClass, plugin, mongoose } from '@typegoose/typegoose';
import { restify } from '../plugins/restify';

@plugin(restify)
export class Tag {
  public id!: mongoose.Types.ObjectId;
  
  @prop({ required: true })
  public name!: string;
}

export const TagModel = getModelForClass(Tag);

/**
 * @swagger
 * components:
 *  schemas:
 *    Tag:
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
