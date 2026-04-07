import { ID } from "@collaro/utils/generate";
import { IMemberDTO, IMemberStore, IWorkspaceMemberManager, MemberStore, TMemberId } from "../member/index";
import { IRequestMember, IRequestMemberDTO, IWorkspaceDTO, IWorkspaceStore, MemoryWorkspaceStore, RequestMember, TRequestId } from "@collaro/workspace";
import { IUser, IUserDTO, User } from "@collaro/user";
import { MemberSorting } from "@collaro/sorting/interface";
import { Input } from "@collaro/utils/omit";
import { WorkspaceNotification, workspaceNotification } from "@collaro/notification";

export class WorkspaceMemberManager implements IWorkspaceMemberManager {
  private memberStore: IMemberStore = new MemberStore();
  private workspaceStore: IWorkspaceStore = new MemoryWorkspaceStore();
  private notificationService: WorkspaceNotification = workspaceNotification;
  private requestService: IRequestMember = new RequestMember();
  private user: IUser = new User();

  private sorting = new MemberSorting();

  private async joinWorkspace(workspaceId: IWorkspaceDTO["id"], userId: IUserDTO["id"]): Promise<IMemberDTO> {
    // 1. Validate if the workspace exists.
    const workspace = await this.findWorkspaceById(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace with ID: ${workspaceId} not found. Cannot join workspace.`);
    }

    // 2. Validate if the user exists.
    const user = this.user.getUser(userId);
    if (!user) throw new Error(`User with ID: ${userId} not found. Cannot join workspace.`);

    // 3. Create a new member entry for the user in the workspace.
    const newMember: IMemberDTO & { role: "admin" | "member" } = {
      id: ID.memberId(),
      name: user!.name,
      workspaceId,
      role: "admin",
      createdAt: new Date(),
      updatedAt: null,
      userId,
    };

    // 4. Save the new member to the store.
    this.memberStore.save(newMember);

    // 5. Send a notification to the user about joining the workspace.
    await this.notificationService.createMemberNotification({
      type: "request_approved",
      userName: user.userName,
      workspaceName: workspace.name || workspace.slug,
      memberID: newMember.id,
      userId: user.id,
      workspaceId: workspaceId,
    });
  
    // 6. Send a notification to the workspace owner about the new member joining.
    await this.notificationService.createWorkspaceNotification({
      userName: user.userName,
      type: "workspace_joined",
      userId: workspace.ownerId,
      workspaceId: workspaceId,
      workspaceName: workspace.name,
      memberID: newMember.id,
    });

    return Promise.resolve(newMember);
  }

  async findWorkspaceById(id: IWorkspaceDTO["id"]): Promise<IWorkspaceDTO | null> {
    const workspace = await this.workspaceStore.findById(id);
    return workspace;
  }
  
  async createWorkspace(workspace: Input<IWorkspaceDTO>): Promise<IWorkspaceDTO> {
    // Fetch the owner user details to ensure the owner exists before creating the workspace.
    const user = await this.user.getUser(workspace.ownerId);
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

    // Create a notification for the workspace creation.
    await this.notificationService.createWorkspaceNotification({
      workspaceName: newWorkspace.name,
      type: "workspace_created",
      memberID: ownerMember.id,
      userId: workspace.ownerId,
      workspaceId: newWorkspace.id,
    })

    return Promise.resolve(newWorkspace);
  }

  async updateWorkspace(
    workspaceId: IWorkspaceDTO["id"], 
    workspaceData: Partial<Omit<IWorkspaceDTO, "id" | "createdAt" | "updatedAt">>, 
    memberId: TMemberId
  ): Promise<IWorkspaceDTO> {
    // 1. Validate if the workspace exists.
    const existingWorkspace = await this.memberStore.checkMemberExists(workspaceId, memberId);
    if (!existingWorkspace) {
      console.log(`Workspace with ID: ${workspaceId} not found. Cannot update workspace.`);
      throw new Error(`Workspace with ID: ${workspaceId} not found.`);
    }

    const workspaceDetail = await this.findWorkspaceById(workspaceId);
    
    const member = await this.memberStore.findById(memberId);

    if (!member || member.role === "member") {
      throw new Error("Only workspace admins can update workspace details.");
    }

    const dto: IWorkspaceDTO = {
      ...workspaceDetail!,
      ...workspaceData,
      updatedAt: new Date(),
    }
    
    // 2. Update the workspace details in the store.
    await this.workspaceStore.update(workspaceId, dto);
    
    // 3. Send a notification to all workspace members about the workspace update.
    await this.notificationService.createWorkspaceNotification({
      workspaceName: dto.name,
      type: "workspace_updated",
      userId: workspaceDetail!.ownerId,
      workspaceId: workspaceId,
      memberID: memberId,
      userName: member.name,
    })

    return dto;
  }

  async approveJoinRequest(requestId: TRequestId, approvedBy: TMemberId): Promise<IMemberDTO> {
    try {
      // 1. Fetch the join request details.
      const request = await this.requestService.getRequest(requestId);
      if (!request) {
        throw new Error(`Join request with ID: ${requestId} not found.`);
      }
      
      // 2. Validate if the approver is a member of the workspace 
      const approver = await this.memberStore.checkMemberExists(request.workspaceId, approvedBy);
      if (!approver) {
        throw new Error("Approver is not a member of the workspace. Cannot approve join request.");
      }

      // 3. Validate if the approver has sufficient permissions to approve the join request (e.g., admin or owner).
      const approverDetails = await this.memberStore.findById(approvedBy);
      if (!approverDetails || approverDetails.role === "member") {
        throw new Error("Approver does not have sufficient permissions to approve join requests.");
      }
  
      // 4. Approve the join request and update the request status in the store.
      const result = await this.requestService.approveRequest(requestId);  
      if (!result || !result.success) {
        throw new Error(`Failed to approve join request with ID: ${requestId}.`);
      }
  
      // 5. Add the user as a member of the workspace.
      const newMember = await this.joinWorkspace(request.workspaceId, request.userId);
  
      return newMember;
    } catch (error: unknown) {
      throw new Error(`Error approving join request: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }

  async rejectJoinRequest(requestId: TRequestId, rejectedBy: TMemberId): Promise<void> {
    try {
      // 1. Fetch the join request details.
      const request = await this.requestService.getRequest(requestId);
      if (!request) {
        throw new Error(`Join request with ID: ${requestId} not found.`);
      }

      // 2. Validate if the rejector is a member of the workspace
      const rejector = await this.memberStore.checkMemberExists(request.workspaceId, rejectedBy);
      if (!rejector) {
        throw new Error("Rejector is not a member of the workspace. Cannot reject join request.");
      }
      
      // 3. Validate if the rejector has sufficient permissions to reject the join request (e.g., admin or owner). 
      const rejectorDetails = await this.memberStore.findById(rejectedBy);
      if (!rejectorDetails || rejectorDetails.role === "member") {
        throw new Error("Rejector does not have sufficient permissions to reject join requests.");
      }

      const workspace = await this.findWorkspaceById(request.workspaceId);

      // 4. Reject the join request and update the request status in the store.
      await this.requestService.rejectRequest(requestId);

      await this.notificationService.createMemberNotification({
        type: "request_rejected",
        userName: request.name,
        workspaceName: workspace!.name,
        userId: request.userId,
        workspaceId: request.workspaceId,
      });

    } catch (error: unknown) {
      throw new Error(`Error rejecting join request: ${(error as Error).message}`, {
        cause: error,
      });
    }
  }

  async banMember(workspaceId: IWorkspaceDTO["id"], memberId: TMemberId): Promise<void> {
    // Implementation to ban a member from a workspace.
    const member = await this.memberStore.findById(memberId);

    const workspace = await this.findWorkspaceById(workspaceId);

    if (!member) {
      throw new Error(`Member with ID: ${memberId} not found.`);
    }

    if (!workspace) {
      throw new Error(`Workspace with ID: ${workspaceId} not found.`);
    }

    this.memberStore.update(memberId, member);
    console.log(`Banning member with ID: ${memberId} from workspace ID: ${workspaceId}`);
  }

  async listMembers(workspaceId: IWorkspaceDTO["id"]): Promise<IMemberDTO[]> {
    try {
      // Implementation to get a list of members in a workspace.
      const member = this.memberStore;
      const workspace = await this.findWorkspaceById(workspaceId);
  
      if (!workspace) {
        console.log(`Workspace with ID: ${workspaceId} not found. Cannot fetch members.`);
        throw new Error(`Workspace with ID: ${workspaceId} not found.`);
      }
  
      const list = await member.list();
      const workspaceMembers = list.filter(member => member.workspaceId === workspaceId);
  
      const sortedWorkspaceMembers = this.sorting.sortByName(workspaceMembers, "asc");
  
      return sortedWorkspaceMembers;
    } catch (error) {
      console.error(`Error fetching members for workspace ID: ${workspaceId}.`, error);
      throw error;
    }
  }

  async removeMemberFromWorkspace(workspaceId: IWorkspaceDTO["id"], memberId: TMemberId): Promise<void> {
    // 1. Validate Member exists
    const memberExists = await this.memberStore.checkMemberExists(workspaceId, memberId);
    if (!memberExists) {
      throw new Error(`Member with ID: ${memberId} not found in workspace ID: ${workspaceId}.`);
    }

    const member = await this.memberStore.findById(memberId);
    const workspace = await this.findWorkspaceById(workspaceId);

    // 2. Implementation to remove a member from a workspace.
    await this.memberStore.delete(memberId);

    // 3. Send a notification to the member about being removed from the workspace.
    await this.notificationService.createMemberNotification({
      type: "member_removed",
      memberID: memberId,
      workspaceId,
      userId: member!.userId,
      userName: member!.name,
      workspaceName: workspace!.name,
    })
  }

  async listMemberDetails(
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

    const members = await this.memberStore.list();
    const memberDetails = members.find(member => member.userId === userID && member.workspaceId === workspaceId);
    
    if (!memberDetails) {
      console.log(`Member details for user ID: ${userID} not found.`);
      return null;
    }
    
    return memberDetails;
  }

  async requestWorkspace(workspaceId: IWorkspaceDTO["id"], userId: IUserDTO["id"]): Promise<void> {
    const workspace = await this.findWorkspaceById(workspaceId);
    
    const user = await this.user.getUser(userId);

    if (!workspace || !user) {
      throw new Error(`Workspace or User not found. Cannot request to join workspace.`);
    }

    const request: IRequestMemberDTO = {
      id: ID.requestId(),
      userId,
      workspaceId,
      name: user.name,
      role: "member",
      createdAt: new Date(),
      updatedAt: null,
    };

    // Save the join request to the store
    const result = await this.requestService.createRequest(request);

    // Send a notification to the workspace owner about the new join request
    await this.notificationService.createMemberNotification({
      workspaceName: workspace.name,
      userName: user.userName,
      type: "join_request",
      userId: workspace.ownerId,
      workspaceId,
    });

    if (!result) {
      throw new Error(`Failed to create join request for user ID: ${userId} and workspace ID: ${workspaceId}.`);
    }

    return Promise.resolve();
  }

  async listRequests(workspaceId: IWorkspaceDTO["id"]): Promise<IRequestMemberDTO[]> {
   // fetch all join requests for a specific workspace

   return await this.requestService.listRequests(workspaceId);
  }
}