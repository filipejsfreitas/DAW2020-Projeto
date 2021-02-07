import { CommentModel } from "@models/Comment";
import { Resource } from "@models/Resource";
import { User } from "@models/User";
import { DocumentType } from "@typegoose/typegoose";
import * as Replies from "@controllers/Replies";
import { ReplyModel } from "@models/Reply";

export function get(id: string, populateResource = false) {
  const query = CommentModel.findById(id)

  if(populateResource) {
    query.populate('resource')
  }

  return query.exec();
}

export function getResourceComment(resource: DocumentType<Resource>, id: string) {
  return CommentModel.findById(id).exec()
}

export async function insert(resource: DocumentType<Resource>, author: DocumentType<User>, contents: string[]) {
  const comment = new CommentModel({ resource, author, contents })

  return await comment.save();
}

export async function deleteAll(resource: DocumentType<Resource>) {
  for (const comment of await CommentModel.find({ resource }).exec()) {
    await Replies.deleteAll(comment);

    await comment.deleteOne();
  }
}
