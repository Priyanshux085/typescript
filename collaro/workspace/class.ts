import { ID } from "@collaro/utils/generate";
import { IWorkspace, IWorkspaceDTO, IWorkspaceStore, TWorkspaceId } from "./interface";
import { MemoryWorkspaceStore } from "./stores/memory-workspace-store";

export class Workspace implements IWorkspace {
  workspace: IWorkspaceDTO = {} as IWorkspaceDTO;
  store: IWorkspaceStore = new MemoryWorkspaceStore();

  createWorkspace(workspace: Omit<IWorkspaceDTO, "id">): IWorkspaceDTO {
    
    const newWorkspace: IWorkspaceDTO = {
      ...workspace,
      id: ID.workspaceId(workspace.name),
      createdAt: new Date(),
      updatedAt: null,
    };

    console.log(`Creating workspace with ID: ${newWorkspace.id} and name: ${newWorkspace.name}`);
    this.store.save(newWorkspace);
    return newWorkspace;
  }

  getWorkspace(id: TWorkspaceId): IWorkspaceDTO | null {
    const workspace = this.store.findById(id);
    console.log(`Found workspace: ${JSON.stringify(workspace)}`);
    return workspace;
  }

  updateWorkspace(id: TWorkspaceId, workspace: Partial<IWorkspaceDTO>): void {
    console.log(`Updating workspace with ID: ${id} with data: ${JSON.stringify(workspace)}`);
    this.store.update(id, workspace);
  }

  deleteWorkspace(id: TWorkspaceId): void {
    console.log(`Deleting workspace with ID: ${id}`);
    this.store.delete(id);
  }

  uploadLogo(id: TWorkspaceId, logo: string): void {
    console.log(`Uploading logo for workspace with ID: ${id}`);
    const workspace = this.store.findById(id);
    if (workspace) {
      workspace.logoUrl = logo;
      this.store.update(id, workspace);
    } else {
      console.log(`Workspace with ID: ${id} not found for logo upload.`);
    }
  }
}