import { FileModel, File } from "@models/File";
import { Resource } from "@models/Resource";
import { DocumentType } from "@typegoose/typegoose";
import * as Resources from "@controllers/Resources";

export function get(id: string) {
  return FileModel.findById(id).exec();
}

export async function insert(filename: string, path: string) {
  const file = new FileModel({ filename, path })

  return await file.save();
}

export async function getAllOrCreate(files: { filename: string, path: string }[]) {
  const results = await FileModel.find({
    $or: files.map(f => ({ filename: f.filename }))
  }).exec();

  for(const f of files) {
    if(!results.find(file => file.filename === f.filename)) {
      results.push(await new FileModel(f).save())
    }
  }

  return results;
}

export function deleteAll(resource: DocumentType<Resource>) {
  return FileModel.deleteMany({ resource }).exec()
}
