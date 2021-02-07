import { UserRoleModel } from '@models/UserRole';
import { UserModel } from '@models/User';
import * as UserRoles from './UserRoles';

export function list() {
  return UserModel
    .find()
    .exec();
}

export function get(id: string) {
  return UserModel.findById(id).exec();
}

interface UserCreate {
  name: string,
  email: string,
  role: string;
  affiliation: string
}

export async function insert(user: UserCreate, password: string) {
  const { name, email, affiliation } = user;
  const role = await UserRoles.get(user.role);

  return await UserModel.register(new UserModel({ name, email, affiliation, role }), password);
}

export function remove(email: string) {
  return UserModel.deleteOne({ email });
}

interface UserUpdate {
  name?: string,
  email?: string,
  password?: string,
  role?: typeof UserRoleModel;
  affiliation?: string
}

export async function update(id: string, data: UserUpdate) {
  const user = await UserModel.findById(id).exec();

  if(!user) {
    return null;
  }

  user.update(data);

  return await user.save();
}
