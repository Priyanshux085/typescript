import { UserId } from "@collaro/utils/brand";

export interface IUserDTO {
  id: UserId;
  name: string;
  userName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  user: IUserDTO;

  // methods
  createUser(user: IUserDTO): void;
  getUser(id: UserId): IUserDTO | null;
  updateUser(id: UserId, user: Partial<IUserDTO>): void;
  deleteUser(id: UserId): void;
}