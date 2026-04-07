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
  createWorkspace(workspace: Omit<IWorkspaceDTO, "id">): Promise<IWorkspaceDTO>;
  getWorkspace(id: TWorkspaceId): Promise<IWorkspaceDTO | null>;
  updateWorkspace(id: TWorkspaceId, workspace: Partial<IWorkspaceDTO>): Promise<void>;
  deleteWorkspace(id: TWorkspaceId): Promise<void>;
  uploadLogo(id: TWorkspaceId, logo: string): Promise<void>;
}

export interface IWorkspaceStore {
  save(workspace: IWorkspaceDTO): Promise<void>;
  findById(id: TWorkspaceId): Promise<IWorkspaceDTO | null>;
  update(id: TWorkspaceId, workspace: Partial<IWorkspaceDTO>): Promise<void>;
  delete(id: TWorkspaceId): Promise<void>;
  list(): Promise<IWorkspaceDTO[]>;
}
