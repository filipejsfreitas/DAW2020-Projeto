import { prop, getModelForClass, modelOptions, plugin, mongoose } from '@typegoose/typegoose';

import { User } from './User';
import { ResourceType } from './ResourceType';
import { Tag } from './Tag';
import { Author } from './Author';
import { Comment } from './Comment';
import { File } from './File';
import { restify } from '../plugins/restify';

@modelOptions({ schemaOptions: { timestamps: { createdAt: 'uploadedAt', updatedAt: 'updatedAt' } } })
@plugin(restify)
export class Resource {
  public id!: mongoose.Types.ObjectId;

  @prop({ required: true })
  public title!: string;

  @prop({ required: true })
  public subtitle!: string;

  @prop({ required: true })
  public description!: string;

  @prop({ required: true, ref: User, autopopulate: true })
  public uploader!: User;

  @prop({ required: true, ref: ResourceType, autopopulate: true })
  public type!: ResourceType;

  @prop({ required: true })
  public visibility!: 'public' | 'private';

  @prop({ required: true, ref: () => Tag, autopopulate: true })
  public tags!: Tag[];

  @prop({ required: true, ref: () => Author, autopopulate: true })
  public authors!: Author[];

  @prop({ required: true, ref: () => Comment, localField: '_id', foreignField: 'resource', autopopulate: true })
  public comments!: Comment[];

  @prop({ required: true, ref: () => File, autopopulate: true })
  public files!: File[];

  @prop({ required: true })
  public createdAt!: string;
}

export const ResourceModel = getModelForClass(Resource);

/**
 * @swagger
 * components:
 *  schemas:
 *    Resource:
 *      type: object
 *      required:
 *        - id
 *        - title
 *        - subtitle
 *        - description
 *        - uploader
 *        - type
 *        - visibility
 *        - tags
 *        - authors
 *        - posts
 *        - files
 *        - createdAt
 *        - updatedAt
 *      properties:
 *        id:
 *          type: string
 *        title:
 *          type: string
 *        subtitle:
 *          type: string
 *        description:
 *          type: string
 *        uploader:
 *          $ref: '#/components/schemas/User'
 *        visibility:
 *          type: string
 *          enum: [public, private]
 *        tags:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Tag'
 *        authors:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Author'
 *        posts:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/Post'
 *        files:
 *          type: array
 *          items:
 *            $ref: '#/components/schemas/File'
 *        createdAt:
 *          type: string
 *        updatedAt:
 *          type: string
 */
