import { IWorkspaceDTO, IWorkspaceStore, TWorkspaceId } from "./../interface";

export class MemoryWorkspaceStore implements IWorkspaceStore {
  private workspaces: IWorkspaceDTO[] = [];

  save(workspace: IWorkspaceDTO): void {
    this.workspaces.push(workspace);
  }

  findById(id: TWorkspaceId): IWorkspaceDTO | null {
    return this.workspaces.find((workspace) => workspace.id === id) || null;
  }

  update(id: TWorkspaceId, workspace: Partial<IWorkspaceDTO>): void {
    const index = this.workspaces.findIndex((w) => w.id === id);
    if (index !== -1) {
      this.workspaces[index] = { ...this.workspaces[index], ...workspace } as IWorkspaceDTO;
    }
  }

  delete(id: TWorkspaceId): void {
    this.workspaces = this.workspaces.filter((workspace) => workspace.id !== id);
  }

  list(): IWorkspaceDTO[] {
    return [...this.workspaces];
  }
}
