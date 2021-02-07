/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Schema } from 'mongoose';
import mongooseAutoPopulate from 'mongoose-autopopulate';

export const toJSON = {
  virtuals: true,
  transform(doc: any, ret: { _id: any, __v: any }) {
    delete ret._id;
    delete ret.__v;
  }
};

export const toObject = {
  virtuals: true
};

/**
 * Simple mongoose plugin intended to hide the _id and __v fields from the
 * JSON response that is sent to the clients.
 * Also applies the autopopulate plugin.
 */
export function restify(schema: Schema): void {
  // @ts-ignore
  schema.options.toJSON = {
    virtuals: true,
    transform(doc: any, ret: { _id: any, __v: any }) {
      delete ret._id;
      delete ret.__v;
    }
  }

  // @ts-ignore
  schema.options.toObject = {
    virtuals: true
  };

  schema.plugin(mongooseAutoPopulate);
}
