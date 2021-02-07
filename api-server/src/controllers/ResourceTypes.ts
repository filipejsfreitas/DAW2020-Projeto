import { ResourceTypeModel } from "@models/ResourceType";

export async function getByNameOrCreate(name: string) {
  return await ResourceTypeModel.findOne({ name }).exec()
    ?? await new ResourceTypeModel({ name }).save()
}

export function list() {
  return ResourceTypeModel.find().exec()
}

export function getAllById(types: string[]) {
  return ResourceTypeModel.find({
    $or: types.map(t => ({ _id: t }))
  }).exec();
}

export function getAllByName(types: string[]) {
  return ResourceTypeModel.find({
    $or: types.map(t => ({ name: t }))
  }).exec();
}
