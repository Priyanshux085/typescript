import { ID } from "@collaro/utils/generate";
import { IMemberDTO, IMemberStore, IWorkspaceMemberManager, MemberStore, TMemberId } from "../member/index";
import { IWorkspaceDTO, IWorkspaceStore, MemoryWorkspaceStore } from "@collaro/workspace";
import { IUser, IUserDTO, User } from "@collaro/user";
import { MemberSorting } from "@collaro/sorting/interface";
import { Input } from "@collaro/utils/omit";

export class WorkspaceMemberManager implements IWorkspaceMemberManager {
  memberStore: IMemberStore = new MemberStore();
  workspaceStore: IWorkspaceStore = new MemoryWorkspaceStore();
  user: IUser = new User();

  private sorting = new MemberSorting();

  findWorkspaceById(id: IWorkspaceDTO["id"]): IWorkspaceDTO | null {
    const workspace = this.workspaceStore.findById(id);
    return workspace;
  }
  
  createWorkspace(workspace: Input<IWorkspaceDTO>): IWorkspaceDTO {
    // Fetch the owner user details to ensure the owner exists before creating the workspace.
    const user = this.user.getUser(workspace.ownerId);
    if (!user) {
      console.log(`Owner with ID: ${workspace.ownerId} not found. Cannot create workspace.`);
      throw new Error(`Owner with ID: ${workspace.ownerId} not found.`);
    }
    
    // Implementation to create a new workspace.
    const newWorkspace: IWorkspaceDTO = {
      ...workspace,
      id: ID.workspaceId(),
      createdAt: new Date(),
      updatedAt: null,
    };
    this.workspaceStore.save(newWorkspace);
        
    // Implementation to create a default admin member for the new workspace.
    const ownerMember: IMemberDTO = {
      userId: workspace.ownerId,
      id: ID.memberId(),
      workspaceId: newWorkspace.id,
      name: `${user.name} Owner`,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: null,
    };
    this.memberStore.save(ownerMember);

    return newWorkspace;
  }
  
  joinWorkspace(workspaceId: IWorkspaceDTO["id"], userId: IUserDTO["id"]): void {
    const workspace = this.findWorkspaceById(workspaceId);
    if (!workspace) {
      console.log(`Workspace with ID: ${workspaceId} not found. Cannot add member.`);
      return;
    }

    const user = this.user.getUser(userId);
    if (!user) {
      console.log(`User with ID: ${userId} not found. Cannot add member to workspace.`);
      return;
    }

    const newMember: IMemberDTO = {
      id: ID.memberId(),
      name: user.name,
      workspaceId,
      role: 'member',
      createdAt: new Date(),
      updatedAt: null,
      userId,
    };

    this.memberStore.save(newMember);
  }

  banMember(workspaceId: IWorkspaceDTO["id"], memberId: TMemberId): void {
    // Implementation to ban a member from a workspace.
    console.log(`Banning member with ID: ${memberId} from workspace ID: ${workspaceId}`);
  }

  listMembers(workspaceId: IWorkspaceDTO["id"]): IMemberDTO[] {
    try {
      // Implementation to get a list of members in a workspace.
      const member = this.memberStore;
      const workspace = this.findWorkspaceById(workspaceId);
  
      if (!workspace) {
        console.log(`Workspace with ID: ${workspaceId} not found. Cannot fetch members.`);
        throw new Error(`Workspace with ID: ${workspaceId} not found.`);
      }
  
      const list = member.list();
      const workspaceMembers = list.filter(member => member.workspaceId === workspaceId);
  
      const sortedWorkspaceMembers = this.sorting.sortByName(workspaceMembers, "asc");
  
      return sortedWorkspaceMembers;
    } catch (error) {
      console.error(`Error fetching members for workspace ID: ${workspaceId}.`, error);
      throw error;
    }
  }

  removeMemberFromWorkspace(workspaceId: IWorkspaceDTO["id"], memberId: TMemberId): void {
    // Implementation to remove a member from a workspace.
    const member = this.memberStore;
    
    member.delete(memberId);
    console.log(`Removing member with ID: ${memberId} from workspace ID: ${workspaceId}`);
  }

  async getMemberDetails(
    query: {
      userID: IUserDTO["id"], 
      workspaceId: IWorkspaceDTO["id"]
    }): Promise<IMemberDTO | null> {
    // Implementation to get member details based on user ID and workspace ID.
    const { userID, workspaceId } = query;

    const user = await this.user.getUser(userID);
    if (!user) {
      throw new Error(`User with ID: ${userID} not found. Cannot fetch member details.`);
    }

    const members = this.memberStore.list();
    const memberDetails = members.find(member => member.userId === userID && member.workspaceId === workspaceId);
    
    if (!memberDetails) {
      console.log(`Member details for user ID: ${userID} not found.`);
      return null;
    }
    
    return memberDetails;
  }
}