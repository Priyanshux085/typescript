import { ID } from "@collaro/utils/generate";
import { IUser, IUserDTO, IUserStore, TCreateUserInput, TUserId } from "./interface";
import { UserStore } from "./user-store";

export class User implements IUser {
  private fetchUser(id: TUserId): IUserDTO | null {
    const user = this.store.findById(id);
    return user;
  }
  user: IUserDTO = {} as IUserDTO;
  private store: IUserStore = UserStore.getInstance();

  private findById(id: TUserId): IUserDTO | null {
    const user = this.store.findById(id);
    return user;
  }

  createUser(input: TCreateUserInput): IUserDTO {
    const newUser: IUserDTO = {
      ...input,
      id: ID.userId(),
      createdAt: new Date(),
      updatedAt: null,
    };
    this.store.save(newUser);
    this.user = newUser;
    return newUser;
  }

  updateUser(id: TUserId, user: Partial<IUserDTO>): IUserDTO | null {
    // Implementation to update user information

    if (this.findById(id)) {
      // Update the user information
      this.store.update(id, user);

      // Return the updated user
      return this.store.findById(id);
    }

    return this.user.id === id ? this.user : null;
  }

  deleteUser(id: TUserId): void {
    // Implementation to delete a user by ID
    if (this.user.id === id) {
      this.user = {} as IUserDTO; // Clear user data
    }
  }

  getUser(id: TUserId): IUserDTO | null {
    // Implementation to get a user by ID
    return this.findById(id);
  }

  get listUsers(): IUserDTO[] {
    // Implementation to return a list of users
    return [this.user];
  }
}