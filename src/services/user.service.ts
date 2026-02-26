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

  async findUserByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async createUser(data: Partial<User>) {
    const user = this.userRepository.create(data);
    return await this.userRepository.save(user);
  }

  async updateUser(id: string, data: Partial<User>) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      return null;
    }
    Object.assign(user, data);
    return await this.userRepository.save(user); // returns updated entity directly  
  }

  async deleteUser(id: string) {
    const result = await this.userRepository.delete(id);
    return result.affected !== 0;
  }
}
