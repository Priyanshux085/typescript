import { BRAND } from "@collaro/utils/brand";

export type TUserId = BRAND<"UserId">;
export type TCreateUserInput = Omit<IUserDTO, "id" | "createdAt" | "updatedAt">;

export interface IUserDTO {
  id: TUserId;
  name: string;
  userName: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface IUser {
  user: IUserDTO;

  // methods
  createUser(input: TCreateUserInput): void;
  getUser(id: TUserId): IUserDTO | null;
  updateUser(id: TUserId, user: Partial<IUserDTO>): IUserDTO | null;
  deleteUser(id: TUserId): void;
}

export interface IUserStore {
  save(user: IUserDTO): void;
  findById(id: TUserId): IUserDTO | null;
  update(id: TUserId, user: Partial<IUserDTO>): IUserDTO | null;
  delete(id: TUserId): void;
  list(): IUserDTO[];
}