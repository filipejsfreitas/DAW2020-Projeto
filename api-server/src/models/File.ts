import { prop, getModelForClass, modelOptions, plugin, mongoose } from '@typegoose/typegoose';
import { restify } from '../plugins/restify';

@modelOptions({ schemaOptions: { timestamps: true } })
@plugin(restify)
export class File {
  public id!: mongoose.Types.ObjectId;
  
  @prop({ required: true })
  public filename!: string;

  @prop({ required: true })
  public path!: string;
}

export const FileModel = getModelForClass(File);

/**
 * @swagger
 * components:
 *  schemas:
 *    File:
 *      type: object
 *      required:
 *        - id
 *        - resource
 *        - path
 *        - createdAt
 *        - updatedAt
 *      properties:
 *        id:
 *          type: string
 *        resource:
 *          $ref: '#/components/schemas/Resource'
 *        path:
 *          type: string
 *        createdAt:
 *          type: string
 *        updatedAt:
 *          type: string
 */
