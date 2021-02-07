import { UserRoleModel } from '@models/UserRole';

export function list() {
    return UserRoleModel.find().exec();
}

export function get(name: string) {
    return UserRoleModel.findOne({ name }).exec();
}

export function insert(name: string) {
    return new UserRoleModel({ name }).save();
}

export function remove(name: string) {
    return UserRoleModel.deleteOne({ name });
}
