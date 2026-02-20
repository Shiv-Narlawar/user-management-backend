import { AppDataSource } from "../config/data-source";
import { User } from "../entities/user.entity";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async getAllUsers() {
    return await this.userRepository.find({
      relations: ["role", "applications"],
    });
  }

  async getUserById(id: string) {
    return await this.userRepository.findOne({
      where: { id },
      relations: ["role"],
    });
  }

  async createUser(data: Partial<User>) {
    const user = this.userRepository.create(data);
    return await this.userRepository.save(user);
  }

  async updateUser(id: string, data: Partial<User>) {
    await this.userRepository.update(id, data);
    return await this.getUserById(id);
  }

  async deleteUser(id: string) {
    const result = await this.userRepository.softDelete(id);
    return result.affected !== 0;
  }
}
