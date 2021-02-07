import { prop, getModelForClass, modelOptions, Ref, plugin, mongoose } from '@typegoose/typegoose';

import { Resource } from './Resource';
import { User } from './User';
import { Reply } from './Reply';
import { restify } from '../plugins/restify';

@modelOptions({ schemaOptions: { timestamps: true } })
@plugin(restify)
export class Comment {
  public id!: mongoose.Types.ObjectId;
  
  @prop({ required: true, ref: 'Resource' })
  public resource!: Resource;

  @prop({ required: true, ref: User, autopopulate: true })
  public author!: User;

  @prop({ required: true, type: () => [String] })
  public contents!: string[];

  @prop({ required: true, ref: () => Reply, localField: '_id', foreignField: 'comment', autopopulate: true })
  public replies!: Reply[];
}

export const CommentModel = getModelForClass(Comment);

/**
 * @swagger
 * components:
 *  schemas:
 *    Comment:
 *      type: object
 *      required:
 *        - id
 *        - resource
 *        - author
 *        - content
 *        - replies
 *        - createdAt
 *        - updatedAt
 *      properties:
 *        id:
 *          type: string
 *        resource:
 *          $ref: '#/components/schemas/Resource'
 *        author:
 *          $ref: '#/components/schemas/User'
 *        content:
 *          type: array
 *          items:
 *            type: string
 *        replies:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Reply'
 *        createdAt:
 *          type: string
 *        updatedAt:
 *          type: string
 */
