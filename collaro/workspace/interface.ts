import { IUserDTO } from "@collaro/user";
import { BRAND } from "@collaro/utils/brand";

export type TWorkspaceId = BRAND<"WorkspaceId">;

/**
 * IWorkspaceDTO represents the data transfer object for a workspace, 
 * containing properties such as id, name, description, createdAt, and updatedAt.
 */
export interface IWorkspaceDTO {
  id: TWorkspaceId;
  name: string;
  slug: string;
  logoUrl?: string;
  ownerId: IUserDTO["id"];
  description: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface IWorkspace {
  workspace: IWorkspaceDTO;

  // methods
  createWorkspace(workspace: Omit<IWorkspaceDTO, "id">): IWorkspaceDTO;
  getWorkspace(id: TWorkspaceId): IWorkspaceDTO | null;
  updateWorkspace(id: TWorkspaceId, workspace: Partial<IWorkspaceDTO>): void;
  deleteWorkspace(id: TWorkspaceId): void;
  uploadLogo(id: TWorkspaceId, logo: string): void;
}

export interface IWorkspaceStore {
  save(workspace: IWorkspaceDTO): void;
  findById(id: TWorkspaceId): IWorkspaceDTO | null;
  update(id: TWorkspaceId, workspace: Partial<IWorkspaceDTO>): void;
  delete(id: TWorkspaceId): void;
  list(): IWorkspaceDTO[];
}
