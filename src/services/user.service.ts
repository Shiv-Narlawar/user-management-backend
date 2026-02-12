import { User } from "../models/user.model";

const users: User[] = [];

export class UserService {
  getAllUsers(): User[] {
    return users;
  }
  
  getUserById(id: string): User | undefined {
    return users.find(user => user.id === id);
  }
  
  createUser(user: User): User {
    users.push(user);
    return user;
  }

  updateUser(id: string, updatedData: Partial<User>): User | undefined {
    const user = users.find(u => u.id === id);
    if (!user) return undefined;

    Object.assign(user, updatedData);
    return user;
  }

  deleteUser(id: string): boolean {
  const index = users.findIndex(user => user.id === id);

  if (index === -1) {
    return false;
  }

  users.splice(index, 1);
  return true;
}

}