import { prop, getModelForClass, plugin, mongoose } from '@typegoose/typegoose';
import { restify } from '../plugins/restify';

@plugin(restify)
export class Author {
  public id!: mongoose.Types.ObjectId;
  
  @prop({ required: true })
  public name!: string;

  @prop({ required: false })
  public orcid?: string;
}

export const AuthorModel = getModelForClass(Author);

/**
 * @swagger
 * components:
 *  schemas:
 *    Author:
 *      type: object
 *      required:
 *        - id
 *        - name
 *        - orcid
 *      properties:
 *        id:
 *          type: string
 *        name:
 *          type: string
 *        orcid:
 *          type: string
 */
