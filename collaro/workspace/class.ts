import { IMemberDTO } from "@collaro/member";
import { IWorkspace, IWorkspaceDTO } from "./interface";
import { UserId } from "@collaro/utils/brand";

export class Workspace implements IWorkspace {
  private addToWorkspace(id: UserId): void {
    // Implementation to add a user to the workspace
    console.log(`Adding user with ID: ${id} to workspace with ID: ${this.workspace.id}`);
    this.members.push({
      id: id,
      name: "Member Name",
      email: "member@example.com",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  constructor(public workspace: IWorkspaceDTO) {
    this.addToWorkspace(workspace.ownerId);
  }

  members: IMemberDTO[] = [];

  createWorkspace(workspace: IWorkspaceDTO): void {
    // Implementation to create a new workspace
    this.workspace = workspace;
  }

  getWorkspace(id: string): IWorkspaceDTO | null {
    // Implementation to get a workspace by ID
    return this.workspace.id === id ? this.workspace : null;
  }

  banMember(workspaceId: string, memberId: string): void {
    // Implementation to ban a member from a workspace
    if (this.workspace.id === workspaceId) {
      this.members = this.members.filter(member => member.id !== memberId);
    }
  }

  deleteWorkspace(id: string): void {
    // Implementation to delete a workspace by ID
    if (this.workspace.id === id) {
      this.workspace = {} as IWorkspaceDTO; // Clear workspace data
      this.members = []; // Clear members list
    }
  }

  updateWorkspace(id: string, workspace: Partial<IWorkspaceDTO>): void {
    // Implementation to update workspace information
    if (this.workspace.id === id) {
      this.workspace = { ...this.workspace, ...workspace };
    }
  }

  uploadLogo(id: string, logo: string): void {
    // Implementation to upload a logo for the workspace
    if (this.workspace.id === id) {
      this.workspace.logoUrl = logo;
    }
  }
}