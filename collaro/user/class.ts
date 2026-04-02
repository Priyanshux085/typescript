import { IUser, IUserDTO } from "./interface";

export class User implements IUser {
  constructor(public user: IUserDTO) {}

  createUser(user: IUserDTO): void {
    // Implementation to create a new user
    this.user = user;
  }

  updateUser(id: string, user: Partial<IUserDTO>): void {
    // Implementation to update user information

    if (this.user.id === id) {
      this.user = { ...this.user, ...user };
    }
  }

  deleteUser(id: string): void {
    // Implementation to delete a user by ID
    if (this.user.id === id) {
      this.user = {} as IUserDTO; // Clear user data
    }
  }

  getUser(id: string): IUserDTO | null {
    // Implementation to get a user by ID
    return this.user.id === id ? this.user : null;
  }

  get listUsers(): IUserDTO[] {
    // Implementation to return a list of users
    return [this.user];
  }
}