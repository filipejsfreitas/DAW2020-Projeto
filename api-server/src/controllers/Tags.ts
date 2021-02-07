import { ResourceModel } from "@models/Resource";
import { Tag, TagModel } from "@models/Tag";
import { DocumentType } from "@typegoose/typegoose";

export async function getAllOrCreate(tags: string[]) {
  if(tags.length === 0) {
    return [];
  }

  const results = await TagModel.find({
    $or: tags.map(t => ({ name: t }))
  }).exec();

  for (const t of tags) {
    if(!results.find(tag => tag.name === t)) {
      results.push(await new TagModel({ name: t }).save())
    }
  }

  return results;
}

export function get(id: string) {
  return TagModel.findById(id).exec()
}

export function getResources(tag: DocumentType<Tag>, skip: number, limit: number) {
  return ResourceModel
    .find({ tags: tag })
    .limit(limit)
    .skip(skip)
    .exec()
}
