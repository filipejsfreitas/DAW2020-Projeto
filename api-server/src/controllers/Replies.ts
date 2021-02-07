import { ReplyModel } from "@models/Reply";
import { Comment, CommentModel } from "@models/Comment";
import { User } from "@models/User";
import { DocumentType } from "@typegoose/typegoose";

export function get(id: string, populateComment = false) {
  const query = CommentModel.findById(id)
  
  if(populateComment) {
    query.populate('comment')
  }

  return query.exec()
}

export async function insert(comment: DocumentType<Comment>, author: DocumentType<User>, contents: string[]) {
  const reply = new ReplyModel({ comment, author, contents })

  return await reply.save();
}

export function deleteAll(comment: DocumentType<Comment>) {
  return ReplyModel.deleteMany({ comment }).exec()
}
