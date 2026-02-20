import { User } from "../models/user.model";

const users: User[] = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@test.com",
    password: "123456",
    role: "admin",
    status: "ACTIVE"
  }
];


export class UserService {
  getAllUsers(): User[] {
    return users;
  }
  
  getUserById(id: string): User | undefined {
    return users.find(user => user.id === id);
  }
  
  createUser(userData: Omit<User, "id">): User {
  const newUser: User = {
    id: Date.now().toString(),
    ...userData,
  };

  users.push(newUser);
  return newUser;
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