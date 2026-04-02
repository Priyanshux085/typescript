import { IWorkspaceDTO } from "@collaro/workspace";
import { IMember, IMemberDTO } from "./interface";

export class Member implements IMember {
  member: IMemberDTO;

  constructor(member: IMemberDTO, private workspaceId: IWorkspaceDTO["id"]) {
    this.member = member;
    this.workspaceId = workspaceId;

    // add the member to the workspace
    this.addToWorkspace(workspaceId, member);
  }

  addMember(member: IMemberDTO): void {
    // Implementation to add a member
    console.log(`Adding member with ID: ${member.id} to workspace ID: ${this.workspaceId}`);
  }

  getMember(id: string): IMemberDTO | null {
    // Implementation to get a member by ID
    console.log(`Getting member with ID: ${id} from workspace ID: ${this.workspaceId}`);
    return this.member.id === id ? this.member : null;
  }

  updateMember(id: string, member: Partial<IMemberDTO>): void {
    // Implementation to update a member's information
    console.log(`Updating member with ID: ${id} in workspace ID: ${this.workspaceId}`);
    console.log(`Updated member data: ${JSON.stringify(member)}`);
  }

  removeMember(id: string): void {
    // Implementation to remove a member by ID
    console.log(`Removing member with ID: ${id} from workspace ID: ${this.workspaceId}`);
  }

  get listMembers(): IMemberDTO[] {
    // Implementation to return a list of members
    console.log(`Fetching list of members from workspace ID: ${this.workspaceId}`);
    return [];
  }

  addToWorkspace(workspaceId: IWorkspaceDTO["id"], member: IMemberDTO): void {
    // Implementation to add a member to a workspace.
    console.log(`Adding member with ID: ${member.id} to workspace ID: ${workspaceId}`);
  }

  removeFromWorkspace(workspaceId: IWorkspaceDTO["id"], memberId: string): void {
    // Implementation to remove a member from a workspace.
    console.log(`Removing member with ID: ${memberId} from workspace ID: ${workspaceId}`);
  }

  private fetchWorkspace(id: IWorkspaceDTO["id"]): IWorkspaceDTO {
    // Implementation to fetch workspace details by ID
    console.log(`Fetching workspace with ID: ${id}`);
    return {
      id: "workspace-id",
      name: "Example Workspace",
      description: "This is an example workspace.",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IWorkspaceDTO;
  }

  worrkspace: IWorkspaceDTO = this.fetchWorkspace(this.workspaceId);
}
