import { IMemberDTO } from "@collaro/member/interface";
import { IUserDTO } from "@collaro/user";
import { MemberId, WorkspaceId } from "@collaro/utils/brand";

/**
 * IWorkspaceDTO represents the data transfer object for a workspace, 
 * containing properties such as id, name, description, createdAt, and updatedAt.
 */
export interface IWorkspaceDTO {
  id: WorkspaceId;
  name: string;
  logoUrl?: string;
  ownerId: IUserDTO["id"];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspace {
  workspace: IWorkspaceDTO;
  members: IMemberDTO[];

  // methods
  createWorkspace(workspace: IWorkspaceDTO): void;
  getWorkspace(id: WorkspaceId): IWorkspaceDTO | null;
  updateWorkspace(id: WorkspaceId, workspace: Partial<IWorkspaceDTO>): void;
  deleteWorkspace(id: WorkspaceId): void;
  uploadLogo(id: WorkspaceId, logo: string): void;
  banMember(workspaceId: WorkspaceId, memberId: MemberId  ): void;
}
