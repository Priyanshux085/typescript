import { ID } from "@collaro/utils/generate";
import { IWorkspace, IWorkspaceDTO, IWorkspaceStore, TWorkspaceId } from "./interface";
import { MemoryWorkspaceStore } from "./stores/memory-workspace-store";

export class Workspace implements IWorkspace {
  workspace: IWorkspaceDTO = {} as IWorkspaceDTO;
  store: IWorkspaceStore = new MemoryWorkspaceStore();

  async createWorkspace(workspace: Omit<IWorkspaceDTO, "id">): Promise<IWorkspaceDTO> {
    
    const newWorkspace: IWorkspaceDTO = {
      ...workspace,
      id: ID.workspaceId(),
      createdAt: new Date(),
      updatedAt: null,
    };

    await this.store.save(newWorkspace);
    return newWorkspace;
  }

  async getWorkspace(id: TWorkspaceId): Promise<IWorkspaceDTO | null> {
    const workspace = await this.store.findById(id);
    return Promise.resolve(workspace ?? null);
  }

  async updateWorkspace(id: TWorkspaceId, workspace: Partial<IWorkspaceDTO>): Promise<void> {
    console.log(`Updating workspace with ID: ${id} with data: ${JSON.stringify(workspace)}`);
    await this.store.update(id, workspace);
  }

  async deleteWorkspace(id: TWorkspaceId): Promise<void> {
    console.log(`Deleting workspace with ID: ${id}`);
    await this.store.delete(id);
  }

  async uploadLogo(id: TWorkspaceId, logo: string): Promise<void> {
    console.log(`Uploading logo for workspace with ID: ${id}`);
    const workspace = await this.store.findById(id);
    if (workspace) {
      workspace.logoUrl = logo;
      await this.store.update(id, workspace);
    } else {
      console.log(`Workspace with ID: ${id} not found for logo upload.`);
    }
  }
}