import { Resource, ResourceModel } from '@models/Resource';

import * as Files from './Files';
import * as Tags from './Tags';
import * as Authors from './Authors';
import * as ResourceTypes from './ResourceTypes';

import { User } from '@models/User';
import { FilterQuery } from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';
import { isBuffer } from 'util';

interface ResourceCreate {
  title: string,
  subtitle: string,
  description: string,
  uploader: User,
  type: string,
  tags: string[],
  authors: string[],
  createdAt: string | undefined
}

interface ResourceUpdate extends ResourceCreate {
  visibility: 'public' | 'private' | null | undefined
}

export async function list(user: Express.User | undefined) {
  if(!user) {
    return await ResourceModel.find({ visibility: 'public' }).sort({ uploadedAt: 'desc' }).limit(10).exec();
  }

  if(user.role.name === 'admin') {
    return await ResourceModel.find().sort({ uploadedAt: 'desc' }).limit(10).exec()
  }

  return await ResourceModel.find({
    $or: [
      { visibility: 'public' },
      { uploader: user.id }
    ]
  }).sort({ uploadedAt: 'desc' }).limit(10).exec()
}

interface SearchParameters {
  search: string,
  type: string[] | null | undefined
}

export async function search(searchParams: SearchParameters, user: Express.User | undefined, skip: number, limit: number) {
  const { search: term, type } = searchParams;

  const queryParams: FilterQuery<Resource> = {
    $and: [{
      $or: [
        { title: { $regex: term } },
        { subtitle: { $regex: term } },
        { description: { $regex: term } }
      ]
    }]
  }

  if(type) {
    queryParams.type = { $in: await ResourceTypes.getAllById(type) };
  }

  if(user?.role.name !== 'admin') {
    queryParams.$and?.push({ 
      $or: [
        { visibility: 'public' },
        { uploader: user }
      ]
    })
  }
  
  return {
    resources: await ResourceModel.find(queryParams).sort({ uploadedAt: 'desc' }).skip(skip).limit(limit).exec(),
    totalCount: await ResourceModel.find(queryParams).countDocuments().exec()
  }
}

export async function create(resourceData: ResourceCreate) {
  const { title, subtitle, description, uploader, type, tags, authors, createdAt } = resourceData;

  const data = {
    title,
    subtitle,
    description,
    uploader,
    type: await ResourceTypes.getByNameOrCreate(type),
    authors: await Authors.getAllOrCreate(authors),
    tags: await Tags.getAllOrCreate(tags),
    visibility: 'private',
    files: [],
    createdAt
  }

  return await new ResourceModel(data).save()
}

export function get(id: string) {
  return ResourceModel.findById(id).exec();
}

export async function getUserResources(user: DocumentType<User>, restrictPublic?: boolean, skip = 0, limit = 10) {
  const options = {
    uploader: user
  };

  if(restrictPublic) {
    return {
      resources: await ResourceModel.find({ ...options, visibility: 'public' }).sort({ uploadedAt: 'desc' }).skip(skip).limit(limit).exec(),
      totalCount: await ResourceModel.find({ ...options, visibility: 'public'}).countDocuments().exec()
    };
  } else {
    return {
      resources: await ResourceModel.find(options).sort({ uploadedAt: 'desc' }).skip(skip).limit(limit).exec(),
      totalCount: await ResourceModel.find(options).countDocuments().exec()
    };
  }
}

export async function update(resource: DocumentType<Resource>, resourceData: ResourceUpdate) {
  const { title, subtitle, description, uploader, type, tags, visibility, authors, createdAt } = resourceData;

  const data = {
    title,
    subtitle,
    description,
    uploader,
    type: await ResourceTypes.getByNameOrCreate(type),
    authors: await Authors.getAllOrCreate(authors),
    tags: await Tags.getAllOrCreate(tags),
    visibility: visibility ?? resource.visibility,
    createdAt: createdAt ?? resource.createdAt, 
  }

  return await resource.update(data).exec()
}

export async function addFiles(resource: DocumentType<Resource>, files: { id?: string, filename: string, path: string }[]) {
  for(const file of resource.files) {
    if(!files.find(f => f.filename === file.filename)) {
      await Files.deleteOne(file.id.toHexString());
    }
  }

  for(const f of files) {
    if(!resource.files.find(file => file.filename === f.filename)) {
      resource.files.push(await Files.insert(f.filename, f.path))
    }
  }

  return (await resource.save()).files
}
