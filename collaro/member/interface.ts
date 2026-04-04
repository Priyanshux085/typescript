import { IUser, IUserDTO } from "@collaro/user";
import { Input } from "@collaro/utils/omit";
import { IWorkspaceDTO, IWorkspaceStore } from "@collaro/workspace";
import { BRAND } from "zod";

export type TMemberId = BRAND<"MemberId">;

export interface IMemberDTO {
  id: TMemberId;
  name: string;
  userId: IUserDTO["id"];
  workspaceId: IWorkspaceDTO["id"];
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date | null;
}

export interface IMember {
  member: IMemberDTO;
  store: IMemberStore;

  // methods
  addMemberToWorkspace(member: IMemberDTO, workspaceId: IWorkspaceDTO["id"]): void;
  getMember(id: TMemberId): IMemberDTO | null;
  updateMember(id: TMemberId, member: Partial<IMemberDTO>): void;
  removeMember(id: TMemberId): void;
  readonly listMembers: IMemberDTO[];
  removeFromWorkspace(workspaceId: IWorkspaceDTO["id"], memberId: TMemberId): void;
}

export interface IMemberStore {
  save(member: IMemberDTO): void;
  findById(id: TMemberId): IMemberDTO | null;
  update(id: TMemberId, member: Partial<IMemberDTO>): void;
  delete(id: TMemberId): void;
  list(): IMemberDTO[];
}

export interface IWorkspaceMemberManager {
  memberStore: IMemberStore;
  workspaceStore: IWorkspaceStore;
  user: IUser;

  createWorkspace(workspace: Input<IWorkspaceDTO>): void;
  addMemberToWorkspace(workspaceId: IWorkspaceDTO["id"], userId: IUserDTO["id"]): void;
  getWorkspaceMembers(workspaceId: IWorkspaceDTO["id"]): IMemberDTO[];
  banMemberFromWorkspace(workspaceId: IWorkspaceDTO["id"], memberId: TMemberId): void;
  removeMemberFromWorkspace(workspaceId: IWorkspaceDTO["id"], memberId: TMemberId): void;
}