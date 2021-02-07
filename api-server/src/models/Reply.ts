import { prop, getModelForClass, modelOptions, plugin, mongoose } from '@typegoose/typegoose';
import { restify } from '../plugins/restify';

import { Comment } from './Comment';
import { User } from './User';

@modelOptions({ schemaOptions: { timestamps: true }})
@plugin(restify)
export class Reply {
  public id!: mongoose.Types.ObjectId;
  
  @prop({ required: true, ref: 'Comment' })
  public comment!: Comment;

  @prop({ required: true, ref: User, autopopulate: true })
  public author!: User;

  @prop({ required: true, type: () => [String] })
  public contents!: string[];
}

export const ReplyModel = getModelForClass(Reply);

/**
 * @swagger
 * components:
 *  schemas:
 *    Reply:
 *      type: object
 *      required:
 *        - id
 *        - comment
 *        - author
 *        - content
 *        - createdAt
 *        - updatedAt
 *      properties:
 *        id:
 *          type: string
 *        comment:
 *          $ref: '#/components/schemas/Comment'
 *        author:
 *          $ref: '#/components/schemas/User'
 *        content:
 *          type: string
 *        createdAt:
 *          type: string
 *        updatedAt:
 *          type: string
 */
