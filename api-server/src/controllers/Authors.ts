import { AuthorModel } from "@models/Author";

export async function getAllOrCreate(authors: string[]) {
  if(authors.length === 0) {
    return [];
  }

  const results = await AuthorModel.find({
    $or: authors.map(t => ({ name: t }))
  }).exec();

  for (const a of authors) {
    if(!results.find(author => author.name === a)) {
      results.push(await new AuthorModel({ name: a, orcid: null }).save())
    }
  }

  return results;
}
