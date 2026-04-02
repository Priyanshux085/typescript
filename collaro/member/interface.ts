import { IWorkspaceDTO } from "@collaro/workspace";

export interface IMemberDTO {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

export interface IMember {
  member: IMemberDTO;
  worrkspace: IWorkspaceDTO;

  // methods
  addMember(member: IMemberDTO): void;
  getMember(id: string): IMemberDTO | null;
  updateMember(id: string, member: Partial<IMemberDTO>): void;
  removeMember(id: string): void;
  readonly listMembers: IMemberDTO[];
  addToWorkspace(workspaceId: IWorkspaceDTO["id"], member: IMemberDTO): void;
  removeFromWorkspace(workspaceId: IWorkspaceDTO["id"], memberId: string): void;

}